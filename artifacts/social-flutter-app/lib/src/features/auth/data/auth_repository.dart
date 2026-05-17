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
    String? email,
    String? phoneNumber,
    required String password,
    required String displayName,
    required String dateOfBirth,
  }) async {
    final response = await _dio.post('/auth/register', data: {
      'username': username,
      'email': email,
      'phoneNumber': phoneNumber,
      'password': password,
      'displayName': displayName,
      'dateOfBirth': dateOfBirth,
    });
    return AuthResponse.fromJson(response.data);
  }

  Future<bool> checkUsername(String username) async {
    try {
      final response = await _dio.get('/auth/check-username', queryParameters: {
        'username': username,
      });
      return response.data['available'] ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<List<String>> suggestUsernames(String username) async {
    try {
      final response = await _dio.get('/auth/suggest-usernames', queryParameters: {
        'username': username,
      });
      return List<String>.from(response.data['suggestions'] ?? []);
    } catch (e) {
      return [];
    }
  }

  Future<AuthResponse> verify2FA(String email, String code) async {
    final response = await _dio.post('/auth/2fa/verify', data: {
      'email': email,
      'code': code,
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
