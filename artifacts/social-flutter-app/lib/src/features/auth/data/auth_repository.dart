import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider));
});

final currentUserProvider = FutureProvider<User>((ref) {
  return ref.watch(authRepositoryProvider).getMe();
});

class AuthRepository {
  final Dio _dio;

  AuthRepository(this._dio);

  Future<AuthResponse> login(String email, String password) async {
    final response = await _dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return AuthResponse.fromJson(response.data);
  }

  Future<AuthResponse> register({
    required String username,
    required String email,
    required String password,
    required String displayName,
    required DateTime dateOfBirth,
    String? faceImagePath,
  }) async {
    final formData = FormData.fromMap({
      'username': username,
      'email': email,
      'password': password,
      'displayName': displayName,
      'dateOfBirth': dateOfBirth.toIso8601String(),
    });

    if (faceImagePath != null) {
      formData.files.add(
        MapEntry(
          'faceImage',
          await MultipartFile.fromFile(faceImagePath, filename: 'face.jpg'),
        ),
      );
    }

    final response = await _dio.post('/auth/register', data: formData);
    return AuthResponse.fromJson(response.data);
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
  }

  Future<User> getMe() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data);
  }

  Future<AuthResponse> verify2FA(String email, String code) async {
    final response = await _dio.post(
      '/auth/2fa/verify',
      data: {'email': email, 'code': code},
    );
    return AuthResponse.fromJson(response.data);
  }

  Future<bool> checkUsername(String username) async {
    final response = await _dio.get(
      '/auth/check-username',
      queryParameters: {'username': username},
    );
    return response.data['available'] ?? false;
  }

  Future<List<String>> suggestUsernames(String username) async {
    final response = await _dio.get(
      '/auth/suggest-usernames',
      queryParameters: {'username': username},
    );
    return List<String>.from(response.data['suggestions'] ?? []);
  }

  Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword(String token, String password) async {
    await _dio.post(
      '/auth/reset-password',
      data: {'token': token, 'password': password},
    );
  }
}
