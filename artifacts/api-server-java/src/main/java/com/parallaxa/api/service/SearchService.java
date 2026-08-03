package com.parallaxa.api.service;

import com.parallaxa.api.dto.PostDto;
import com.parallaxa.api.dto.UserDto;
import com.parallaxa.api.entity.Post;
import com.parallaxa.api.entity.User;
import com.parallaxa.api.entity.Hashtag;
import com.parallaxa.api.repository.PostRepository;
import com.parallaxa.api.repository.UserRepository;
import com.parallaxa.api.repository.HashtagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {
    private final UserRepository userRepository;
    private final PostRepository postRepository; // In a real app, use a dedicated search repo or index
    private final HashtagRepository hashtagRepository;
    private final AuthService authService;
    private final PostService postService;

    public Map<String, Object> search(String query, String type, String currentUserId) {
        Map<String, Object> results = new HashMap<>();

        List<UserDto> usersList = new ArrayList<>();
        List<PostDto> postsList = new ArrayList<>();
        List<Hashtag> hashtagsList = new ArrayList<>();

        if ("all".equals(type) || "users".equals(type)) {
            List<User> users = userRepository.findByUsernameContainingIgnoreCase(query);
            usersList = users.stream().map(authService::mapToDto).collect(Collectors.toList());
        }

        if ("all".equals(type) || "posts".equals(type)) {
            // Very basic search, ideally use full-text search
            List<Post> posts = postRepository.findByContentContainingIgnoreCaseAndParentPostIsNullAndIsArchivedFalse(query);
            postsList = posts.stream().map(p -> postService.mapToDto(p, currentUserId)).collect(Collectors.toList());
        }

        if ("all".equals(type) || "hashtags".equals(type)) {
            List<Hashtag> hashtags = hashtagRepository.findByNameContainingIgnoreCase(query);
            hashtagsList = hashtags;
        }

        results.put("users", usersList);
        results.put("posts", postsList);
        results.put("hashtags", hashtagsList);

        return results;
    }
}
