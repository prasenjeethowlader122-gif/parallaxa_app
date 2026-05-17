import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/post.dart';

final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepository(ref.watch(dioProvider));
});

final publicFeedProvider = FutureProvider<List<Post>>((ref) async {
  final page = await ref.watch(postRepositoryProvider).getFeed();
  return page.posts;
});

final followingFeedProvider = FutureProvider<List<Post>>((ref) async {
  final page =
      await ref.watch(postRepositoryProvider).getFollowingFeed();
  return page.posts;
});

class PostRepository {
  final Dio _dio;

  PostRepository(this._dio);

  Future<PostPage> getFeed({String? cursor, int limit = 20}) async {
    final response = await _dio.get('/feed', queryParameters: {
      if (cursor != null) 'cursor': cursor,
      'limit': limit,
    });
    return PostPage.fromJson(response.data);
  }

  Future<PostPage> getFollowingFeed(
      {String? cursor, int limit = 20}) async {
    try {
      final response =
          await _dio.get('/feed/following', queryParameters: {
        if (cursor != null) 'cursor': cursor,
        'limit': limit,
      });
      return PostPage.fromJson(response.data);
    } catch (_) {
      return PostPage(posts: const [], nextCursor: null);
    }
  }

  Future<Post> createPost({
    String? content,
    String? imageUrl,
    String? videoUrl,
    String? location,
    List<String>? hashtags,
    String? parentPostId,
  }) async {
    final response = await _dio.post('/posts', data: {
      if (content != null) 'content': content,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (videoUrl != null) 'videoUrl': videoUrl,
      if (location != null) 'location': location,
      if (hashtags != null) 'hashtags': hashtags,
      if (parentPostId != null) 'parentPostId': parentPostId,
    });
    return Post.fromJson(response.data);
  }

  Future<PostPage> getExplorePosts(
      {String? cursor, int limit = 20}) async {
    final response =
        await _dio.get('/explore', queryParameters: {
      if (cursor != null) 'cursor': cursor,
      'limit': limit,
    });
    return PostPage.fromJson(response.data);
  }

  Future<Post> getPost(String postId) async {
    final response = await _dio.get('/posts/$postId');
    return Post.fromJson(response.data);
  }

  Future<void> likePost(String postId) async {
    await _dio.post('/posts/$postId/like');
  }

  Future<void> unlikePost(String postId) async {
    await _dio.delete('/posts/$postId/like');
  }

  Future<void> deletePost(String postId) async {
    await _dio.delete('/posts/$postId');
  }
}
