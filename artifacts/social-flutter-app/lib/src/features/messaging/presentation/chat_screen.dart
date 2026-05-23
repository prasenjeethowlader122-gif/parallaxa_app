import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import '../data/message_repository.dart';
import '../domain/message.dart';
import '../../../core/api_client.dart';

final chatMessagesProvider = FutureProvider.family<MessagePage, String>((
  ref,
  conversationId,
) {
  return ref.watch(messageRepositoryProvider).getMessages(conversationId);
});

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String participantName;

  const ChatScreen({
    super.key,
    required this.conversationId,
    required this.participantName,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final List<Message> _localMessages = [];
  bool _isSending = false;

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _isSending) return;

    _messageController.clear();
    setState(() => _isSending = true);

    final storageService = ref.read(storageServiceProvider);
    final currentUserId = storageService.getCurrentUserId() ?? '';

    final optimistic = Message(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: widget.conversationId,
      senderId: currentUserId,
      content: content,
      isRead: false,
      createdAt: DateTime.now(),
    );

    setState(() => _localMessages.add(optimistic));
    _scrollToBottom();

    try {
      final repo = ref.read(messageRepositoryProvider);
      final sent = await repo.sendMessage(
        widget.conversationId,
        content: content,
      );
      if (mounted) {
        setState(() {
          final idx = _localMessages.indexWhere((m) => m.id == optimistic.id);
          if (idx != -1) _localMessages[idx] = sent;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _localMessages.removeWhere((m) => m.id == optimistic.id),
        );
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to send message')));
        _messageController.text = content;
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(
      chatMessagesProvider(widget.conversationId),
    );
    final storageService = ref.read(storageServiceProvider);
    final currentUserId = storageService.getCurrentUserId() ?? '';

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        titleSpacing: 0,
        leading: IconButton(
          icon: HugeIcon(
            icon: HugeIcons.strokeRoundedArrowLeft01,
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white
                : Colors.black,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          widget.participantName,
          style: TextStyle(
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white
                : Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        actions: [
          IconButton(
            icon: HugeIcon(
              icon: HugeIcons.strokeRoundedCall,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : Colors.black,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: HugeIcon(
              icon: HugeIcons.strokeRoundedVideo02,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : Colors.black,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: HugeIcon(
              icon: HugeIcons.strokeRoundedSettings02,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white
                  : Colors.black,
            ),
            onPressed: () {
              // TODO: Implement chat settings
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Chat settings coming soon')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (page) {
                final allMessages = [...page.messages, ..._localMessages];
                if (allMessages.isNotEmpty) _scrollToBottom();
                return allMessages.isEmpty
                    ? const Center(
                        child: Text(
                          'No messages yet. Say hello!',
                          style: TextStyle(color: Colors.grey),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        itemCount: allMessages.length,
                        itemBuilder: (context, index) {
                          final msg = allMessages[index];
                          final isMine = msg.senderId == currentUserId;
                          return _MessageBubble(message: msg, isMine: isMine);
                        },
                      );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(
                child: Text(
                  'Could not load messages',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          ),
          const Divider(height: 1),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _messageController,
                        maxLines: 4,
                        minLines: 1,
                        style: const TextStyle(fontSize: 15),
                        decoration: const InputDecoration(
                          hintText: 'Message...',
                          hintStyle: TextStyle(color: Colors.grey),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                        textInputAction: TextInputAction.send,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _sendMessage,
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: const BoxDecoration(
                        color: Color(0xFF0095F6),
                        shape: BoxShape.circle,
                      ),
                      child: const HugeIcon(
                        icon: HugeIcons.strokeRoundedSent,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMine;

  const _MessageBubble({required this.message, required this.isMine});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Align(
        alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
        child: Column(
          crossAxisAlignment: isMine
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.7,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMine ? const Color(0xFF0095F6) : Colors.grey.shade100,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isMine ? 18 : 4),
                  bottomRight: Radius.circular(isMine ? 4 : 18),
                ),
              ),
              child: message.mediaUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: CachedNetworkImage(
                        imageUrl: message.mediaUrl!,
                        fit: BoxFit.cover,
                      ),
                    )
                  : Text(
                      message.content ?? '',
                      style: TextStyle(
                        color: isMine ? Colors.white : Colors.black87,
                        fontSize: 15,
                      ),
                    ),
            ),
            const SizedBox(height: 2),
            Text(
              DateFormat.jm().format(message.createdAt),
              style: const TextStyle(color: Colors.grey, fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}
