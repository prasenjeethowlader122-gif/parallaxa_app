import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/notification.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(dioProvider));
});

class NotificationRepository {
  final Dio _dio;

  NotificationRepository(this._dio);

  Future<NotificationPage> getNotifications({
    String? cursor,
    int limit = 20,
  }) async {
    final response = await _dio.get(
      '/notifications',
      queryParameters: {if (cursor != null) 'cursor': cursor, 'limit': limit},
    );
    return NotificationPage.fromJson(response.data);
  }

  Future<void> markAsRead() async {
    await _dio.post('/notifications/read');
  }

  Future<int> getUnreadCount() async {
    final response = await _dio.get('/notifications/unread-count');
    return response.data['count'] as int;
  }
}
