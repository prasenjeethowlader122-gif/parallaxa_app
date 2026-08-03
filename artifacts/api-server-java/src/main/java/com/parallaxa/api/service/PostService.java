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

    public PageResponse<PostDto> getFeed(String userId, int limit) {
        PageRequest pageRequest = PageRequest.of(0, 200); // Fetch top 200 root posts for dynamic ML ranking
        Page<Post> postsPage = postRepository.findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(pageRequest);
        List<Post> posts = new ArrayList<>(postsPage.getContent());

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

        return PageResponse.<PostDto>builder()
                .posts(rankedSublist.stream().map(p -> mapToDto(p, userId)).collect(Collectors.toList()))
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

        return PageResponse.<PostDto>builder()
                .posts(posts.getContent().stream().map(p -> mapToDto(p, userId)).collect(Collectors.toList()))
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

        Post post = Post.builder()
                .id(UUID.randomUUID().toString())
                .author(user)
                .parentPost(parentPost)
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .videoUrl(request.getVideoUrl())
                .location(request.getLocation())
                .createdAt(LocalDateTime.now())
                .build();

        Post savedPost = postRepository.save(post);

        if (parentPost != null) {
            parentPost.setRepliesCount(parentPost.getRepliesCount() + 1);
            postRepository.save(parentPost);
        } else {
            user.setPostsCount(user.getPostsCount() + 1);
            userRepository.save(user);
        }

        // Handle hashtags
        if (request.getHashtags() != null) {
            for (String tagName : request.getHashtags()) {
                if (tagName == null) continue;
                String name = tagName.toLowerCase().replace("#", "");
                if (name.isEmpty()) continue;

                Hashtag hashtag = hashtagRepository.findByName(name)
                        .orElseGet(() -> Hashtag.builder()
                                .id(UUID.randomUUID().toString())
                                .name(name)
                                .postCount(0)
                                .build());

                hashtag.setPostCount(hashtag.getPostCount() + 1);
                hashtagRepository.save(hashtag);
                // In a full implementation, we'd also have a many-to-many relationship table
            }
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

        Post repost = Post.builder()
                .id(UUID.randomUUID().toString())
                .author(user)
                .repostOf(originalPost)
                .build();

        Post savedRepost = postRepository.save(repost);
        originalPost.setRepostsCount(originalPost.getRepostsCount() + 1);
        postRepository.save(originalPost);

        return mapToDto(savedRepost, userId);
    }

    public PageResponse<PostDto> getPostReplies(String postId, String userId) {
        Post parentPost = postRepository.findById(postId).orElseThrow();
        PageRequest pageRequest = PageRequest.of(0, 50);
        Page<Post> replies = postRepository.findByParentPostAndIsArchivedFalseOrderByCreatedAtDesc(parentPost, pageRequest);

        return PageResponse.<PostDto>builder()
                .posts(replies.getContent().stream().map(p -> mapToDto(p, userId)).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public void deletePost(String userId, String postId) {
        Post post = postRepository.findById(postId).orElseThrow();
        if (!post.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        postRepository.delete(post);
    }

    public PageResponse<PostDto> getSavedPosts(String userId) {
        User user = userRepository.findById(userId).orElseThrow();
        PageRequest pageRequest = PageRequest.of(0, 50);
        Page<SavedPost> savedPosts = savedPostRepository.findByUserOrderByCreatedAtDesc(user, pageRequest);

        return PageResponse.<PostDto>builder()
                .posts(savedPosts.getContent().stream().map(sp -> mapToDto(sp.getPost(), userId)).collect(Collectors.toList()))
                .build();
    }

    public PageResponse<PostDto> getExplorePosts(String userId) {
        PageRequest pageRequest = PageRequest.of(0, 20);
        Page<Post> posts = postRepository.findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(pageRequest);
        return PageResponse.<PostDto>builder()
                .posts(posts.getContent().stream().map(p -> mapToDto(p, userId)).collect(Collectors.toList()))
                .build();
    }

    public PageResponse<PostDto> getUserPosts(String userId, String targetUserId) {
        User targetUser;
        if ("me".equals(targetUserId)) {
            targetUser = userRepository.findById(userId).orElseThrow();
        } else {
            targetUser = userRepository.findById(targetUserId).orElseThrow();
        }

        PageRequest pageRequest = PageRequest.of(0, 50);
        Page<Post> posts = postRepository.findByAuthorAndParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(targetUser, pageRequest);

        return PageResponse.<PostDto>builder()
                .posts(posts.getContent().stream().map(p -> mapToDto(p, userId)).collect(Collectors.toList()))
                .build();
    }

    public PostDto mapToDto(Post post, String currentUserId) {
        boolean isLiked = false;
        boolean isSaved = false;
        boolean isFollowing = false;

        if (currentUserId != null) {
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            if (currentUser != null) {
                isLiked = likeRepository.existsByUserAndPost(currentUser, post);
                isSaved = savedPostRepository.existsByUserAndPost(currentUser, post);
                isFollowing = followRepository.existsByFollowerAndFollowing(currentUser, post.getAuthor());
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
                .hashtags(new ArrayList<>()) // Simplified
                .createdAt(post.getCreatedAt() != null ? post.getCreatedAt() : LocalDateTime.now())
                .repostOf(post.getRepostOf() != null ? mapToDto(post.getRepostOf(), currentUserId) : null)
                .build();
    }
}
