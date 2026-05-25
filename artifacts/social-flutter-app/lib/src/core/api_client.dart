import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'storage_service.dart';
import 'error_provider.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('StorageService must be initialized in main()');
});

class AppConfig {
  static const String appName = 'Parallaxa';
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://parallaxa-app-t5p2.onrender.com/api',
  );
}

final dioProvider = Provider<Dio>((ref) {
  final storageService = ref.watch(storageServiceProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = storageService.getAuthToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        String errorMessage = 'An unexpected error occurred';

        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          errorMessage = 'Connection timed out. Please check your internet.';
        } else if (e.type == DioExceptionType.badResponse) {
          final data = e.response?.data;
          if (data is Map && data.containsKey('message')) {
            errorMessage = data['message'];
          } else if (data is Map && data.containsKey('error')) {
            errorMessage = data['error'];
          } else {
            errorMessage = 'Server error: ${e.response?.statusCode}';
          }
        } else if (e.type == DioExceptionType.connectionError) {
          errorMessage = 'No internet connection';
        }

        ref.read(errorProvider.notifier).showError(errorMessage);

        if (e.response?.statusCode == 401) {
          await storageService.clearAll();
        }
        return handler.next(e);
      },
    ),
  );

  return dio;
});
