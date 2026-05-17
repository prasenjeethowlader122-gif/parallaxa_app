import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return DateFormat('EEE').format(dt);
    return DateFormat('MM/dd').format(dt);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversationsAsync = ref.watch(conversationsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Messages',
          style: TextStyle(
            fontFamily: 'Sora',
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Colors.black),
            onPressed: () {},
          ),
        ],
      ),
      body: conversationsAsync.when(
        data: (conversations) => conversations.isEmpty
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.chat_bubble_outline,
                        size: 48, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('No messages yet',
                        style: TextStyle(
                            color: Colors.grey, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Start a conversation',
                        style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () => ref.refresh(conversationsProvider.future),
                child: ListView.separated(
                  itemCount: conversations.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, indent: 72),
                  itemBuilder: (context, index) {
                    final conv = conversations[index];
                    final hasUnread = conv.unreadCount > 0;
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 4),
                      leading: CircleAvatar(
                        radius: 26,
                        backgroundColor: Colors.grey.shade200,
                        backgroundImage:
                            conv.participant.avatarUrl != null
                                ? CachedNetworkImageProvider(
                                    conv.participant.avatarUrl!)
                                : null,
                        child: conv.participant.avatarUrl == null
                            ? const Icon(Icons.person,
                                color: Colors.grey, size: 26)
                            : null,
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              conv.participant.displayName,
                              style: TextStyle(
                                fontWeight: hasUnread
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                fontSize: 15,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            _formatTime(conv.updatedAt),
                            style: TextStyle(
                              fontSize: 12,
                              color: hasUnread
                                  ? const Color(0xFF0095F6)
                                  : Colors.grey,
                              fontWeight: hasUnread
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                      subtitle: Row(
                        children: [
                          Expanded(
                            child: Text(
                              conv.lastMessage?.content ?? 'Say hello!',
                              style: TextStyle(
                                color: hasUnread
                                    ? Colors.black87
                                    : Colors.grey.shade500,
                                fontWeight: hasUnread
                                    ? FontWeight.w500
                                    : FontWeight.normal,
                                fontSize: 13,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ),
                          if (hasUnread)
                            Container(
                              margin: const EdgeInsets.only(left: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0095F6),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${conv.unreadCount}',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
                      ),
                      onTap: () => context.push(
                        '/messages/${conv.id}',
                        extra: conv.participant.displayName,
                      ),
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
              Text('Could not load messages',
                  style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(conversationsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
