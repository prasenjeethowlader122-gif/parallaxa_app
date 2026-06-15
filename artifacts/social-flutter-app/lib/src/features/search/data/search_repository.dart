import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/search.dart';
import '../../feed/domain/post.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepository(ref.watch(dioProvider));
});

class SearchRepository {
  final Dio _dio;

  SearchRepository(this._dio);

  Future<SearchResults> search(String query, {String type = 'all'}) async {
    final response = await _dio.get(
      'search',
      queryParameters: {'q': query, 'type': type},
    );
    return SearchResults.fromJson(response.data);
  }

  Future<PostPage> getExplorePosts({String? cursor, int limit = 20}) async {
    final response = await _dio.get(
      'explore',
      queryParameters: {'cursor': ?cursor, 'limit': limit},
    );
    return PostPage.fromJson(response.data);
  }
}
