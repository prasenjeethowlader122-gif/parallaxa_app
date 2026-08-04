package com.parallaxa.api.service;

import com.parallaxa.api.dto.*;
import com.parallaxa.api.entity.*;
import com.parallaxa.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final SavedPostRepository savedPostRepository;
    private final FollowRepository followRepository;
    private final HashtagRepository hashtagRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;

    public PageResponse<PostDto> getFeed(String userId, int limit) {
        PageRequest pageRequest = PageRequest.of(0, 200); // Fetch top 200 root posts for dynamic ML ranking
        Page<Post> postsPage = postRepository.findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(pageRequest);
        List<Post> posts = new ArrayList<>(postsPage.getContent());

        // Filter private accounts out of public feed unless followed
        posts = posts.stream().filter(p -> {
            User author = p.getAuthor();
            if (!author.isPrivate()) {
                return true;
            }
            if (userId == null) {
                return false;
            }
            if (author.getId().equals(userId)) {
                return true;
            }
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser == null) {
                return false;
            }
            return followRepository.existsByFollowerAndFollowing(currentUser, author);
        }).collect(Collectors.toList());

        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                List<User> following = followRepository.findByFollower(currentUser).stream()
                        .map(Follow::getFollowing)
                        .collect(Collectors.toList());

                posts.sort((p1, p2) -> {
                    double score1 = calculateMLScore(p1, currentUser, following);
                    double score2 = calculateMLScore(p2, currentUser, following);
                    return Double.compare(score2, score1); // Descending score
                });
            } else {
                posts.sort((p1, p2) -> {
                    double score1 = calculateMLScore(p1, null, null);
                    double score2 = calculateMLScore(p2, null, null);
                    return Double.compare(score2, score1);
                });
            }
        } else {
            posts.sort((p1, p2) -> {
                double score1 = calculateMLScore(p1, null, null);
                double score2 = calculateMLScore(p2, null, null);
                return Double.compare(score2, score1);
            });
        }

        List<Post> rankedSublist = posts.stream()
                .limit(limit)
                .collect(Collectors.toList());

        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> savedPostIds = new java.util.HashSet<>();
        java.util.Set<String> followedAuthorIds = new java.util.HashSet<>();

        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                likedPostIds = likeRepository.findByUser(currentUser).stream().map(l -> l.getPost().getId()).collect(Collectors.toSet());
                savedPostIds = savedPostRepository.findByUser(currentUser).stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
                followedAuthorIds = followRepository.findByFollower(currentUser).stream().map(f -> f.getFollowing().getId()).collect(Collectors.toSet());
            }
        }

        final java.util.Set<String> finalLiked = likedPostIds;
        final java.util.Set<String> finalSaved = savedPostIds;
        final java.util.Set<String> finalFollowed = followedAuthorIds;

        return PageResponse.<PostDto>builder()
                .posts(rankedSublist.stream().map(p -> mapToDto(p, userId, finalLiked, finalSaved, finalFollowed)).collect(Collectors.toList()))
                .build();
    }

    private double calculateMLScore(Post post, User currentUser, List<User> following) {
        // Engagement weight scoring (Likes=3.0, Reposts=5.0, Replies=4.0)
        double engagement = (post.getLikesCount() * 3.0) + (post.getRepostsCount() * 5.0) + (post.getRepliesCount() * 4.0);

        // Time decay calculation (hours passed since creation)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime createdAt = post.getCreatedAt() != null ? post.getCreatedAt() : now;
        long secondsPassed = java.time.Duration.between(createdAt, now).getSeconds();
        double hoursPassed = Math.max(0.0, secondsPassed / 3600.0);

        // Hacker News gravity formula: score = (U + 1) / (T + 2)^G, where gravity G = 1.5
        double score = (engagement + 1.0) / Math.pow(hoursPassed + 2.0, 1.5);

        // Personalization boosts
        if (currentUser != null) {
            // Social graph boost: boost posts from followed creators
            if (following != null && following.contains(post.getAuthor())) {
                score *= 2.5;
            }
            // Self-relevancy boost: slight boost to own posts
            if (post.getAuthor().getId().equals(currentUser.getId())) {
                score *= 1.5;
            }
        }

        return score;
    }

    public PageResponse<PostDto> getFollowingFeed(String userId, int limit) {
        if (userId == null) {
            return PageResponse.<PostDto>builder().posts(new ArrayList<>()).build();
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return PageResponse.<PostDto>builder().posts(new ArrayList<>()).build();
        }

        PageRequest pageRequest = PageRequest.of(0, limit);
        List<User> following = followRepository.findByFollower(user).stream()
                .map(Follow::getFollowing)
                .collect(Collectors.toList());

        if (following.isEmpty()) {
            return PageResponse.<PostDto>builder().posts(new ArrayList<>()).build();
        }

        Page<Post> posts = postRepository.findByAuthorInAndParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(following, pageRequest);

        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> savedPostIds = new java.util.HashSet<>();
        java.util.Set<String> followedAuthorIds = new java.util.HashSet<>();

        likedPostIds = likeRepository.findByUser(user).stream().map(l -> l.getPost().getId()).collect(Collectors.toSet());
        savedPostIds = savedPostRepository.findByUser(user).stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
        followedAuthorIds = following.stream().map(User::getId).collect(Collectors.toSet());

        final java.util.Set<String> finalLiked = likedPostIds;
        final java.util.Set<String> finalSaved = savedPostIds;
        final java.util.Set<String> finalFollowed = followedAuthorIds;

        return PageResponse.<PostDto>builder()
                .posts(posts.getContent().stream().map(p -> mapToDto(p, userId, finalLiked, finalSaved, finalFollowed)).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public PostDto createPost(String userId, CreatePostRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post parentPost = null;
        if (request.getParentPostId() != null && !request.getParentPostId().trim().isEmpty()) {
            parentPost = postRepository.findById(request.getParentPostId())
                    .orElseThrow(() -> new RuntimeException("Parent post not found"));
        }

        List<Hashtag> postHashtags = new ArrayList<>();
        if (request.getHashtags() != null) {
            for (String tagName : request.getHashtags()) {
                if (tagName == null) continue;
                String name = tagName.toLowerCase().replace("#", "").trim();
                if (name.isEmpty()) continue;

                Hashtag hashtag = hashtagRepository.findByName(name)
                        .orElseGet(() -> Hashtag.builder()
                                .id(UUID.randomUUID().toString())
                                .name(name)
                                .postCount(0)
                                .build());

                hashtag.setPostCount(hashtag.getPostCount() + 1);
                hashtagRepository.save(hashtag);
                postHashtags.add(hashtag);
            }
        }

        Post post = Post.builder()
                .id(UUID.randomUUID().toString())
                .author(user)
                .parentPost(parentPost)
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .location(request.getLocation())
                .hashtags(postHashtags)
                .createdAt(LocalDateTime.now())
                .build();

        Post savedPost = postRepository.save(post);

        if (parentPost != null) {
            parentPost.setRepliesCount(parentPost.getRepliesCount() + 1);
            postRepository.save(parentPost);

            // Trigger reply notification
            notificationService.createNotification(parentPost.getAuthor(), user, "reply", parentPost, savedPost.getId(), savedPost.getContent());
        } else {
            user.setPostsCount(user.getPostsCount() + 1);
            userRepository.save(user);
        }

        return mapToDto(savedPost, userId);
    }

    public PostDto getPost(String postId, String userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return mapToDto(post, userId);
    }

    @Transactional
    public MapResponse likePost(String userId, String postId) {
        User user = userRepository.findById(userId).orElseThrow();
        Post post = postRepository.findById(postId).orElseThrow();

        if (likeRepository.existsByUserAndPost(user, post)) {
            return MapResponse.builder().put("message", "Already liked").build();
        }

        Like like = Like.builder().user(user).post(post).build();
        likeRepository.save(like);

        post.setLikesCount(post.getLikesCount() + 1);
        postRepository.save(post);

        // Trigger like notification
        notificationService.createNotification(post.getAuthor(), user, "like", post, null, null);

        return MapResponse.builder().put("message", "Liked").build();
    }

    @Transactional
    public MapResponse unlikePost(String userId, String postId) {
        User user = userRepository.findById(userId).orElseThrow();
        Post post = postRepository.findById(postId).orElseThrow();

        likeRepository.findByUserAndPost(user, post).ifPresent(like -> {
            likeRepository.delete(like);
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            postRepository.save(post);
        });

        return MapResponse.builder().put("message", "Unliked").build();
    }

    @Transactional
    public PostDto repostPost(String userId, String postId) {
        User user = userRepository.findById(userId).orElseThrow();
        Post originalPost = postRepository.findById(postId).orElseThrow();

        if (postRepository.existsByAuthorAndRepostOf(user, originalPost)) {
            throw new IllegalArgumentException("আপনি ইতিমধ্যে এই পোস্টটি রিপোস্ট করেছেন।");
        }

        Post repost = Post.builder()
                .id(UUID.randomUUID().toString())
                .author(user)
                .repostOf(originalPost)
                .build();

        Post savedRepost = postRepository.save(repost);
        originalPost.setRepostsCount(originalPost.getRepostsCount() + 1);
        postRepository.save(originalPost);

        // Trigger repost notification
        notificationService.createNotification(originalPost.getAuthor(), user, "repost", originalPost, savedRepost.getId(), null);

        return mapToDto(savedRepost, userId);
    }

    public PageResponse<PostDto> getPostReplies(String postId, String userId) {
        Post parentPost = postRepository.findById(postId).orElseThrow();
        PageRequest pageRequest = PageRequest.of(0, 50);
        Page<Post> replies = postRepository.findByParentPostAndIsArchivedFalseOrderByCreatedAtDesc(parentPost, pageRequest);

        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> savedPostIds = new java.util.HashSet<>();
        java.util.Set<String> followedAuthorIds = new java.util.HashSet<>();

        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                likedPostIds = likeRepository.findByUser(currentUser).stream().map(l -> l.getPost().getId()).collect(Collectors.toSet());
                savedPostIds = savedPostRepository.findByUser(currentUser).stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
                followedAuthorIds = followRepository.findByFollower(currentUser).stream().map(f -> f.getFollowing().getId()).collect(Collectors.toSet());
            }
        }

        final java.util.Set<String> finalLiked = likedPostIds;
        final java.util.Set<String> finalSaved = savedPostIds;
        final java.util.Set<String> finalFollowed = followedAuthorIds;

        return PageResponse.<PostDto>builder()
                .posts(replies.getContent().stream().map(p -> mapToDto(p, userId, finalLiked, finalSaved, finalFollowed)).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void deletePost(String userId, String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Decrement counters
        if (post.getParentPost() != null) {
            Post parent = post.getParentPost();
            parent.setRepliesCount(Math.max(0, parent.getRepliesCount() - 1));
            postRepository.save(parent);
        } else {
            User author = post.getAuthor();
            author.setPostsCount(Math.max(0, author.getPostsCount() - 1));
            userRepository.save(author);
        }

        // 1. Delete associated Likes
        likeRepository.deleteByPost(post);

        // 2. Delete associated SavedPosts
        savedPostRepository.deleteByPost(post);

        // 3. Delete notifications referring to this post
        notificationRepository.deleteByPost(post);

        // 4. Handle replies (delete them)
        List<Post> replies = postRepository.findByParentPost(post);
        for (Post reply : replies) {
            likeRepository.deleteByPost(reply);
            savedPostRepository.deleteByPost(reply);
            notificationRepository.deleteByPost(reply);
            postRepository.delete(reply);
        }

        // 5. Handle reposts referring to this post (set repostOf to null)
        List<Post> reposts = postRepository.findByRepostOf(post);
        for (Post repost : reposts) {
            repost.setRepostOf(null);
            postRepository.save(repost);
        }

        postRepository.delete(post);
    }

    public PageResponse<PostDto> getSavedPosts(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        PageRequest pageRequest = PageRequest.of(0, 50);
        Page<SavedPost> savedPosts = savedPostRepository.findByUserOrderByCreatedAtDesc(user, pageRequest);

        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> savedPostIds = new java.util.HashSet<>();
        java.util.Set<String> followedAuthorIds = new java.util.HashSet<>();

        likedPostIds = likeRepository.findByUser(user).stream().map(l -> l.getPost().getId()).collect(Collectors.toSet());
        savedPostIds = savedPostRepository.findByUser(user).stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
        followedAuthorIds = followRepository.findByFollower(user).stream().map(f -> f.getFollowing().getId()).collect(Collectors.toSet());

        final java.util.Set<String> finalLiked = likedPostIds;
        final java.util.Set<String> finalSaved = savedPostIds;
        final java.util.Set<String> finalFollowed = followedAuthorIds;

        return PageResponse.<PostDto>builder()
                .posts(savedPosts.getContent().stream().map(sp -> mapToDto(sp.getPost(), userId, finalLiked, finalSaved, finalFollowed)).collect(Collectors.toList()))
                .build();
    }

    public PageResponse<PostDto> getExplorePosts(String userId) {
        PageRequest pageRequest = PageRequest.of(0, 100);
        Page<Post> postsPage = postRepository.findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(pageRequest);

        List<Post> posts = postsPage.getContent().stream().filter(p -> {
            User author = p.getAuthor();
            if (!author.isPrivate()) {
                return true;
            }
            if (userId == null) {
                return false;
            }
            if (author.getId().equals(userId)) {
                return true;
            }
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser == null) {
                return false;
            }
            return followRepository.existsByFollowerAndFollowing(currentUser, author);
        }).limit(20).collect(Collectors.toList());

        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> savedPostIds = new java.util.HashSet<>();
        java.util.Set<String> followedAuthorIds = new java.util.HashSet<>();

        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                likedPostIds = likeRepository.findByUser(currentUser).stream().map(l -> l.getPost().getId()).collect(Collectors.toSet());
                savedPostIds = savedPostRepository.findByUser(currentUser).stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
                followedAuthorIds = followRepository.findByFollower(currentUser).stream().map(f -> f.getFollowing().getId()).collect(Collectors.toSet());
            }
        }

        final java.util.Set<String> finalLiked = likedPostIds;
        final java.util.Set<String> finalSaved = savedPostIds;
        final java.util.Set<String> finalFollowed = followedAuthorIds;

        return PageResponse.<PostDto>builder()
                .posts(posts.stream().map(p -> mapToDto(p, userId, finalLiked, finalSaved, finalFollowed)).collect(Collectors.toList()))
                .build();
    }

    public PageResponse<PostDto> getUserPosts(String userId, String targetUserId) {
        User targetUser;
        if ("me".equals(targetUserId)) {
            if (userId == null) {
                throw new org.springframework.security.access.AccessDeniedException("Unauthorized");
            }
            targetUser = userRepository.findById(userId).orElseThrow();
        } else {
            targetUser = userRepository.findById(targetUserId).orElseThrow();
        }

        if (targetUser.isPrivate()) {
            if (userId == null) {
                throw new org.springframework.security.access.AccessDeniedException("This account is private");
            }
            if (!targetUser.getId().equals(userId)) {
                User currentUser = userRepository.findById(userId).orElse(null);
                if (currentUser == null || !followRepository.existsByFollowerAndFollowing(currentUser, targetUser)) {
                    throw new org.springframework.security.access.AccessDeniedException("This account is private");
                }
            }
        }

        PageRequest pageRequest = PageRequest.of(0, 50);
        Page<Post> posts = postRepository.findByAuthorAndParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(targetUser, pageRequest);

        java.util.Set<String> likedPostIds = new java.util.HashSet<>();
        java.util.Set<String> savedPostIds = new java.util.HashSet<>();
        java.util.Set<String> followedAuthorIds = new java.util.HashSet<>();

        if (userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                likedPostIds = likeRepository.findByUser(currentUser).stream().map(l -> l.getPost().getId()).collect(Collectors.toSet());
                savedPostIds = savedPostRepository.findByUser(currentUser).stream().map(sp -> sp.getPost().getId()).collect(Collectors.toSet());
                followedAuthorIds = followRepository.findByFollower(currentUser).stream().map(f -> f.getFollowing().getId()).collect(Collectors.toSet());
            }
        }

        final java.util.Set<String> finalLiked = likedPostIds;
        final java.util.Set<String> finalSaved = savedPostIds;
        final java.util.Set<String> finalFollowed = followedAuthorIds;

        return PageResponse.<PostDto>builder()
                .posts(posts.getContent().stream().map(p -> mapToDto(p, userId, finalLiked, finalSaved, finalFollowed)).collect(Collectors.toList()))
                .build();
    }

    public PostDto mapToDto(Post post, String currentUserId) {
        return mapToDto(post, currentUserId, null, null, null);
    }

    public PostDto mapToDto(Post post, String currentUserId, java.util.Set<String> likedPostIds, java.util.Set<String> savedPostIds, java.util.Set<String> followedAuthorIds) {
        boolean isLiked = false;
        boolean isSaved = false;
        boolean isFollowing = false;

        if (currentUserId != null) {
            if (likedPostIds != null) {
                isLiked = likedPostIds.contains(post.getId());
            } else {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    isLiked = likeRepository.existsByUserAndPost(currentUser, post);
                }
            }

            if (savedPostIds != null) {
                isSaved = savedPostIds.contains(post.getId());
            } else {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    isSaved = savedPostRepository.existsByUserAndPost(currentUser, post);
                }
            }

            if (followedAuthorIds != null) {
                isFollowing = followedAuthorIds.contains(post.getAuthor().getId());
            } else {
                User currentUser = userRepository.findById(currentUserId).orElse(null);
                if (currentUser != null) {
                    isFollowing = followRepository.existsByFollowerAndFollowing(currentUser, post.getAuthor());
                }
            }
        }

        UserSummaryDto authorDto = UserSummaryDto.builder()
                .id(post.getAuthor().getId())
                .username(post.getAuthor().getUsername())
                .displayName(post.getAuthor().getDisplayName())
                .avatarUrl(post.getAuthor().getAvatarUrl())
                .isVerified(post.getAuthor().isVerified())
                .isFollowing(isFollowing)
                .build();

        return PostDto.builder()
                .id(post.getId())
                .author(authorDto)
                .parentPostId(post.getParentPost() != null ? post.getParentPost().getId() : null)
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .videoUrl(post.getVideoUrl())
                .location(post.getLocation())
                .repostsCount(post.getRepostsCount())
                .likesCount(post.getLikesCount())
                .repliesCount(post.getRepliesCount())
                .commentsCount(post.getRepliesCount())
                .isLiked(isLiked)
                .isSaved(isSaved)
                .hashtags(post.getHashtags() != null ? post.getHashtags().stream().map(Hashtag::getName).collect(Collectors.toList()) : new ArrayList<>())
                .createdAt(post.getCreatedAt() != null ? post.getCreatedAt() : LocalDateTime.now())
                .repostOf(post.getRepostOf() != null ? mapToDto(post.getRepostOf(), currentUserId, likedPostIds, savedPostIds, followedAuthorIds) : null)
                .build();
    }
}
