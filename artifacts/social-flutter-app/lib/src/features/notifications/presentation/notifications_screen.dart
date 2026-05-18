import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../data/notification_repository.dart';
import '../domain/notification.dart';
import '../../../core/app_colors.dart';

final notificationsProvider = FutureProvider<NotificationPage>((ref) {
  return ref.watch(notificationRepositoryProvider).getNotifications();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  String _actionText(String type) {
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

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return DateFormat('MMM d').format(dt);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifAsync = ref.watch(notificationsProvider);

    return notifAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
          strokeWidth: 2,
        ),
      ),
      error: (_, __) => const Center(
        child: Text(
          'Could not load notifications',
          style: TextStyle(color: AppColors.mutedForeground),
        ),
      ),
      data: (page) {
        if (page.notifications.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.notifications_none_rounded,
                  size: 52,
                  color: AppColors.mutedForeground,
                ),
                const SizedBox(height: 16),
                const Text(
                  'No notifications yet',
                  style: TextStyle(
                    fontFamily: 'Sora',
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'When people like or comment on your posts,\nyou\'ll see it here.',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.mutedForeground,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(notificationsProvider);
          },
          child: ListView.builder(
            itemCount: page.notifications.length,
            itemBuilder: (context, i) {
              final n = page.notifications[i];
              return _NotificationRow(
                notification: n,
                actionText: _actionText(n.type),
                time: _formatTime(n.createdAt),
              );
            },
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _NotificationRow extends StatelessWidget {
  final NotificationItem notification;
  final String actionText;
  final String time;

  const _NotificationRow({
    required this.notification,
    required this.actionText,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    final isUnread = !notification.isRead;
    final n = notification;

    return Container(
      color: isUnread ? AppColors.unreadBg : AppColors.background,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Avatar (44px) ─────────────────────────────────────────
          CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.muted,
            backgroundImage: n.fromUser.avatarUrl != null
                ? CachedNetworkImageProvider(n.fromUser.avatarUrl!)
                : null,
            child: n.fromUser.avatarUrl == null
                ? const Icon(
                    Icons.person,
                    color: AppColors.mutedForeground,
                    size: 22,
                  )
                : null,
          ),
          const SizedBox(width: 12),

          // ── Text block ────────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // name + action inline
                Text.rich(
                  TextSpan(
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.foreground,
                      height: 1.4,
                    ),
                    children: [
                      TextSpan(
                        text: n.fromUser.displayName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextSpan(text: ' $actionText'),
                    ],
                  ),
                ),
                // comment preview
                if (n.commentContent != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    n.commentContent!,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textMuted,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                // timestamp
                const SizedBox(height: 6),
                Text(
                  time,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // ── Right side: post thumbnail + unread dot ────────────────
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (n.post?.imageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: CachedNetworkImage(
                    imageUrl: n.post!.imageUrl!,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
              if (isUnread) ...[
                const SizedBox(height: 6),
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
