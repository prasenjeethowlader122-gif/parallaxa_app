import 'package:dio/dio.dart';

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
}
