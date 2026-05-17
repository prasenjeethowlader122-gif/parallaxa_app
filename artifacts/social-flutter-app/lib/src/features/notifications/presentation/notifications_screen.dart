import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../data/notification_repository.dart';
import '../domain/notification.dart';

final notificationsProvider = FutureProvider<NotificationPage>((ref) {
  return ref.watch(notificationRepositoryProvider).getNotifications();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  String _notificationText(String type) {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'mention':
        return 'mentioned you';
      case 'reply':
        return 'replied to your post';
      default:
        return type;
    }
  }

  IconData _notificationIcon(String type) {
    switch (type) {
      case 'like':
        return Icons.favorite;
      case 'comment':
        return Icons.chat_bubble;
      case 'follow':
        return Icons.person_add;
      case 'mention':
        return Icons.alternate_email;
      case 'reply':
        return Icons.reply;
      default:
        return Icons.notifications;
    }
  }

  Color _notificationColor(String type) {
    switch (type) {
      case 'like':
        return Colors.red;
      case 'comment':
        return const Color(0xFF0095F6);
      case 'follow':
        return Colors.green;
      case 'mention':
        return Colors.purple;
      case 'reply':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return DateFormat('MMM d').format(dt);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Notifications',
          style: TextStyle(
            fontFamily: 'Sora',
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        actions: [
          notificationsAsync.whenOrNull(
            data: (page) {
              final hasUnread = page.notifications.any((n) => !n.isRead);
              if (!hasUnread) return null;
              return TextButton(
                onPressed: () async {
                  await ref
                      .read(notificationRepositoryProvider)
                      .markAsRead();
                  ref.invalidate(notificationsProvider);
                },
                child: const Text('Mark all read',
                    style: TextStyle(color: Color(0xFF0095F6))),
              );
            },
          ) ?? const SizedBox.shrink(),
        ],
      ),
      body: notificationsAsync.when(
        data: (page) => page.notifications.isEmpty
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.notifications_none,
                        size: 48, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('No notifications yet',
                        style: TextStyle(color: Colors.grey)),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () => ref.refresh(notificationsProvider.future),
                child: ListView.separated(
                  itemCount: page.notifications.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, indent: 72),
                  itemBuilder: (context, index) {
                    final notification = page.notifications[index];
                    return _NotificationTile(
                      notification: notification,
                      icon: _notificationIcon(notification.type),
                      iconColor: _notificationColor(notification.type),
                      text: _notificationText(notification.type),
                      time: _formatTime(notification.createdAt),
                    );
                  },
                ),
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 40, color: Colors.grey),
              const SizedBox(height: 8),
              Text('Could not load notifications',
                  style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(notificationsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationItem notification;
  final IconData icon;
  final Color iconColor;
  final String text;
  final String time;

  const _NotificationTile({
    required this.notification,
    required this.icon,
    required this.iconColor,
    required this.text,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.isRead;
    return Container(
      color: isUnread ? const Color(0xFFF0F7FF) : Colors.white,
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Stack(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: Colors.grey.shade200,
              backgroundImage: notification.fromUser.avatarUrl != null
                  ? CachedNetworkImageProvider(
                      notification.fromUser.avatarUrl!)
                  : null,
              child: notification.fromUser.avatarUrl == null
                  ? const Icon(Icons.person, color: Colors.grey)
                  : null,
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: iconColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
                child: Icon(icon, size: 10, color: Colors.white),
              ),
            ),
          ],
        ),
        title: RichText(
          text: TextSpan(
            style: const TextStyle(color: Colors.black87, fontSize: 14),
            children: [
              TextSpan(
                text: notification.fromUser.displayName,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const TextSpan(text: ' '),
              TextSpan(text: text),
            ],
          ),
        ),
        subtitle: notification.commentContent != null
            ? Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  notification.commentContent!,
                  style:
                      TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              )
            : null,
        trailing: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (notification.post?.imageUrl != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: CachedNetworkImage(
                  imageUrl: notification.post!.imageUrl!,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) =>
                      const Icon(Icons.broken_image, color: Colors.grey),
                ),
              ),
            const SizedBox(height: 4),
            Text(time,
                style:
                    TextStyle(color: Colors.grey.shade500, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
