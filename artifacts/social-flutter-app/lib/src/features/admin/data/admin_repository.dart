import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../auth/domain/user.dart';

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return AdminRepository(ref.watch(dioProvider));
});

final adminStatsProvider = FutureProvider<AdminStats>((ref) async {
  return ref.watch(adminRepositoryProvider).getStats();
});

final adminUsersProvider = FutureProvider<List<User>>((ref) async {
  return ref.watch(adminRepositoryProvider).getUsers();
});

class AdminStats {
  final int totalUsers;
  final int totalPosts;
  final int totalStories;

  AdminStats({
    required this.totalUsers,
    required this.totalPosts,
    required this.totalStories,
  });

  factory AdminStats.fromJson(Map<String, dynamic> json) {
    return AdminStats(
      totalUsers: json['users'] as int? ?? 0,
      totalPosts: json['posts'] as int? ?? 0,
      totalStories: json['stories'] as int? ?? 0,
    );
  }
}

class AdminRepository {
  final Dio _dio;

  AdminRepository(this._dio);

  Future<void> freezeUser(String userId) async {
    await _dio.post('/admin/users/$userId/freeze');
  }

  Future<void> unfreezeUser(String userId) async {
    await _dio.post('/admin/users/$userId/unfreeze');
  }

  Future<void> approveVerification(String userId) async {
    await _dio.post('/admin/users/$userId/approve-verification');
  }

  Future<void> deletePost(String postId) async {
    await _dio.delete('/admin/posts/$postId');
  }

  Future<AdminStats> getStats() async {
    final response = await _dio.get('/admin/stats');
    return AdminStats.fromJson(response.data);
  }

  Future<List<User>> getUsers() async {
    final response = await _dio.get('/admin/users');
    final data = response.data['users'] as List;
    return data.map((u) => User.fromJson(u)).toList();
  }

  Future<void> verifyUser(String userId) async {
    await _dio.post('/admin/users/$userId/approve-verification');
  }
}
