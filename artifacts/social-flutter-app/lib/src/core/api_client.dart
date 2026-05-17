import 'package:dio/dio.dart';
import 'package:riverpod/riverpod.dart';
import 'storage_service.dart';

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
        if (e.response?.statusCode == 401) {
          await storageService.clearAll();
        }
        return handler.next(e);
      },
    ),
  );

  return dio;
});
