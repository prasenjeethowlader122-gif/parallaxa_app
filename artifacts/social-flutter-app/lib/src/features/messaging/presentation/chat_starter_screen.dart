import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/domain/user.dart';
import '../data/message_repository.dart';
import '../../../core/app_colors.dart';

class ChatStarterScreen extends ConsumerStatefulWidget {
  final User user;
  const ChatStarterScreen({super.key, required this.user});

  @override
  ConsumerState<ChatStarterScreen> createState() => _ChatStarterScreenState();
}

class _ChatStarterScreenState extends ConsumerState<ChatStarterScreen> {
  @override
  void initState() {
    super.initState();
    _startChat();
  }

  Future<void> _startChat() async {
    try {
      final conversation = await ref
          .read(messageRepositoryProvider)
          .startConversation(widget.user.id);
      if (mounted) {
        context.replace(
          '/messages/${conversation.id}',
          extra: widget.user.displayName,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not start conversation: $e')),
        );
        context.pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      ),
    );
  }
}
