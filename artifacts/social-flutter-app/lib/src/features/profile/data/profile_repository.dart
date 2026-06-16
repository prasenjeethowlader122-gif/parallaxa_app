import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../auth/domain/user.dart';
import '../../feed/domain/post.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.watch(dioProvider));
});

class ProfileRepository {
  final Dio _dio;

  ProfileRepository(this._dio);

  Future<User> getUserProfile(String userId) async {
    final path = userId == 'me' ? 'users/me' : 'users/$userId';
    final response = await _dio.get(path);
    return User.fromJson(response.data);
  }

  Future<PostPage> getUserPosts(
    String userId, {
    String? cursor,
    int limit = 20,
  }) async {
    final response = await _dio.get(
      'users/$userId/posts',
      queryParameters: {'cursor': ?cursor, 'limit': limit},
    );
    return PostPage.fromJson(response.data);
  }

  Future<void> followUser(String userId) async {
    await _dio.post('users/$userId/follow');
  }

  Future<void> unfollowUser(String userId) async {
    await _dio.delete('users/$userId/follow');
  }

  Future<User> updateProfile({
    String? displayName,
    String? bio,
    String? website,
    String? avatarUrl,
    String? coverUrl,
    bool? isPrivate,
  }) async {
    final response = await _dio.put(
      'users/me',
      data: {
        if (displayName != null) 'displayName': displayName,
        if (bio != null) 'bio': bio,
        if (website != null) 'website': website,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
        if (coverUrl != null) 'coverUrl': coverUrl,
        if (isPrivate != null) 'isPrivate': isPrivate,
      },
    );
    return User.fromJson(response.data);
  }
}
