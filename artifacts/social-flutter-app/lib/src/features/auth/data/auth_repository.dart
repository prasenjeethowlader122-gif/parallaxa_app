import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<AuthResponse> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return AuthResponse.fromJson(response.data);
  }

  Future<AuthResponse> register({
    required String username,
    required String email,
    required String password,
    required String displayName,
    required DateTime dateOfBirth,
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'username': username,
      'email': email,
      'password': password,
      'displayName': displayName,
      'dateOfBirth': dateOfBirth.toIso8601String(),
    });
    return AuthResponse.fromJson(response.data);
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }

  Future<User> getMe() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data);
  }
}
