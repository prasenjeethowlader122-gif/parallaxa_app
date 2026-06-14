import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../data/message_repository.dart';
import '../domain/message.dart';

final conversationsProvider = FutureProvider<List<Conversation>>((ref) {
  return ref.watch(messageRepositoryProvider).getConversations();
});

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return DateFormat('EEE').format(dt);
    return DateFormat('MM/dd').format(dt);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final convAsync = ref.watch(conversationsProvider);
    final theme = Theme.of(context);

    return convAsync.when(
      loading: () => Center(
        child: CircularProgressIndicator(
          color: theme.colorScheme.primary,
          strokeWidth: 2,
        ),
      ),
      error: (context, error) => Center(
        child: Text(
          'Could not load messages',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
        ),
      ),
      data: (conversations) => Column(
        children: [
          // ── Search bar ────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                style: TextStyle(
                  fontSize: 15,
                  color: theme.colorScheme.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'Search messages',
                  hintStyle: TextStyle(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontSize: 15,
                  ),
                  prefixIcon: Icon(
                    Symbols.search,
                    color: theme.colorScheme.onSurfaceVariant,
                    size: 20,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  fillColor: Colors.transparent,
                ),
              ),
            ),
          ),

          // ── List or empty state ────────────────────────────────────
          Expanded(
            child: conversations.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Symbols.chat,
                          size: 52,
                          color: theme.colorScheme.onSurfaceVariant.withValues(
                            alpha: 0.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No messages yet',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Start a conversation',
                          style: TextStyle(
                            fontSize: 14,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    color: theme.colorScheme.primary,
                    onRefresh: () => ref.refresh(conversationsProvider.future),
                    child: ListView.builder(
                      itemCount: conversations.length,
                      itemBuilder: (context, i) {
                        final conv = conversations[i];
                        return _ConversationTile(
                          conv: conv,
                          time: _formatTime(conv.updatedAt),
                          onTap: () => context.push(
                            '/messages/${conv.id}',
                            extra: conv.participant.displayName,
                          ),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _ConversationTile extends StatelessWidget {
  final Conversation conv;
  final String time;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conv,
    required this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasUnread = conv.unreadCount > 0;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            // ── Avatar (46px) ──────────────────────────────────────
            Stack(
              children: [
                CircleAvatar(
                  radius: 23,
                  backgroundColor: theme.colorScheme.surfaceContainer,
                  backgroundImage: conv.participant.avatarUrl != null
                      ? CachedNetworkImageProvider(conv.participant.avatarUrl!)
                      : null,
                  child: conv.participant.avatarUrl == null
                      ? Icon(
                          Symbols.person,
                          color: theme.colorScheme.onSurfaceVariant,
                          size: 24,
                        )
                      : null,
                ),
              ],
            ),
            const SizedBox(width: 12),

            // ── Text ───────────────────────────────────────────────
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conv.participant.displayName,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: hasUnread
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: theme.colorScheme.onSurface,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        time,
                        style: TextStyle(
                          fontSize: 12,
                          color: hasUnread
                              ? theme.colorScheme.primary
                              : theme.colorScheme.onSurfaceVariant,
                          fontWeight: hasUnread
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conv.lastMessage?.content ?? 'Say hello!',
                          style: TextStyle(
                            fontSize: 13,
                            color: hasUnread
                                ? theme.colorScheme.onSurface
                                : theme.colorScheme.onSurfaceVariant,
                            fontWeight: hasUnread
                                ? FontWeight.w500
                                : FontWeight.normal,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                      if (hasUnread) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${conv.unreadCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
