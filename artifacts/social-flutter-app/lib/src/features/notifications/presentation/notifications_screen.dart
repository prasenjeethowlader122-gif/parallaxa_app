import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/notification_repository.dart';
import '../domain/notification.dart';
import '../../../core/api_client.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(dioProvider));
});

final notificationsProvider = FutureProvider<NotificationPage>((ref) {
  return ref.watch(notificationRepositoryProvider).getNotifications();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontFamily: 'Sora', fontWeight: FontWeight.bold)),
      ),
      body: notificationsAsync.when(
        data: (page) => ListView.separated(
          itemCount: page.notifications.length,
          separatorBuilder: (context, index) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final notification = page.notifications[index];
            return ListTile(
              leading: CircleAvatar(
                backgroundImage: notification.fromUser.avatarUrl != null
                    ? NetworkImage(notification.fromUser.avatarUrl!)
                    : null,
                child: notification.fromUser.avatarUrl == null ? const Icon(Icons.person) : null,
              ),
              title: Text(
                '${notification.fromUser.displayName} ${notification.type}',
                style: TextStyle(fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold),
              ),
              subtitle: notification.commentContent != null ? Text(notification.commentContent!) : null,
              trailing: notification.post?.imageUrl != null
                  ? Image.network(notification.post!.imageUrl!, width: 40, height: 40, fit: BoxFit.cover)
                  : null,
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
