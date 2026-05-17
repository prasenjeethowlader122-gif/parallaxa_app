import 'package:dio/dio.dart';
import '../domain/post.dart';

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

  Future<void> likePost(String postId) async {
    await _dio.post('/posts/$postId/like');
  }

  Future<void> unlikePost(String postId) async {
    await _dio.delete('/posts/$postId/like');
  }
}
