import 'package:dio/dio.dart';
import '../domain/search.dart';
import '../../feed/domain/post.dart';

class SearchRepository {
  final Dio _dio;

  SearchRepository(this._dio);

  Future<SearchResults> search(String query, {String type = 'all'}) async {
    final response = await _dio.get('/search', queryParameters: {
      'q': query,
      'type': type,
    });
    return SearchResults.fromJson(response.data);
  }

  Future<PostPage> getExplorePosts({String? cursor, int limit = 20}) async {
    final response = await _dio.get('/explore', queryParameters: {
      if (cursor != null) 'cursor': cursor,
      'limit': limit,
    });
    return PostPage.fromJson(response.data);
  }
}
