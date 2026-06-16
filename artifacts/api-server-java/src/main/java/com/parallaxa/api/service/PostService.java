package com.parallaxa.api.service;

import com.parallaxa.api.dto.*;
import com.parallaxa.api.entity.*;
import com.parallaxa.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        PageRequest pageRequest = PageRequest.of(0, limit);
        Page<Post> posts;

        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                List<User> following = followRepository.findByFollower(user).stream()
                        .map(Follow::getFollowing)
                        .collect(Collectors.toList());
                following.add(user);
                posts = postRepository.findByAuthorInAndParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(following, pageRequest);
            } else {
                posts = postRepository.findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(pageRequest);
            }
        } else {
            posts = postRepository.findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(pageRequest);
        }

        return PageResponse.<PostDto>builder()
                .posts(posts.getContent().stream().map(p -> mapToDto(p, userId)).collect(Collectors.toList()))
                .build();
    }

    @Transactional
    public PostDto createPost(String userId, CreatePostRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post parentPost = null;
        if (request.getParentPostId() != null) {
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
                .createdAt(post.getCreatedAt())
                .repostOf(post.getRepostOf() != null ? mapToDto(post.getRepostOf(), currentUserId) : null)
                .build();
    }
}
