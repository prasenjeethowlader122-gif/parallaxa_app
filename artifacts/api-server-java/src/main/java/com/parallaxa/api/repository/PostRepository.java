package com.parallaxa.api.repository;

import com.parallaxa.api.entity.Post;
import com.parallaxa.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, String> {
    Page<Post> findByParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByAuthorInAndParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(Collection<User> authors, Pageable pageable);

    Page<Post> findByAuthorAndParentPostIsNullAndIsArchivedFalseOrderByCreatedAtDesc(User author, Pageable pageable);

    Page<Post> findByParentPostAndIsArchivedFalseOrderByCreatedAtDesc(Post parentPost, Pageable pageable);

    List<Post> findByParentPostInAndIsArchivedFalseOrderByCreatedAtDesc(Collection<Post> parentPosts);
}
