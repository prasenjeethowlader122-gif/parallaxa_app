import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../../core/app_colors.dart';
import 'post_card.dart';
import '../../profile/presentation/widgets/user_avatar.dart';

class PostDetailScreen extends ConsumerStatefulWidget {
  final String postId;
  const PostDetailScreen({super.key, required this.postId});

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _commentController = TextEditingController();
  bool _isReplying = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitReply() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    setState(() => _isReplying = true);
    try {
      await ref.read(postRepositoryProvider).createPost(content: text, parentPostId: widget.postId);
      _commentController.clear();
      ref.invalidate(postRepliesProvider(widget.postId));
      ref.invalidate(postDetailProvider(widget.postId));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isReplying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final postAsync = ref.watch(postDetailProvider(widget.postId));
    final repliesAsync = ref.watch(postRepliesProvider(widget.postId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Post'),
        leading: IconButton(
          icon: const Icon(Symbols.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: postAsync.when(
        data: (post) => Column(
          children: [
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(postDetailProvider(widget.postId));
                  ref.invalidate(postRepliesProvider(widget.postId));
                },
                child: ListView(
                  children: [
                    PostCard(post: post, onTap: () {}),
                    const Divider(),
                    repliesAsync.when(
                      data: (page) => Column(
                        children: page.posts.map((reply) => _CommentItem(comment: reply)).toList(),
                      ),
                      loading: () => const Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (e, _) => Center(child: Text('Error loading replies: $e')),
                    ),
                  ],
                ),
              ),
            ),
            _ReplyBar(
              controller: _commentController,
              isReplying: _isReplying,
              onSubmit: _submitReply,
            ),
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _CommentItem extends StatelessWidget {
  final Post comment;
  const _CommentItem({required this.comment});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          UserAvatar(uri: comment.author.avatarUrl, size: 32),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(comment.author.displayName, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(width: 4),
                    Text('@${comment.author.username}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(comment.content ?? ''),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReplyBar extends StatelessWidget {
  final TextEditingController controller;
  final bool isReplying;
  final VoidCallback onSubmit;

  const _ReplyBar({required this.controller, required this.isReplying, required this.onSubmit});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Post your reply',
                border: InputBorder.none,
                filled: false,
              ),
            ),
          ),
          IconButton(
            icon: isReplying ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Symbols.send, color: AppColors.primary),
            onPressed: isReplying ? null : onSubmit,
          ),
        ],
      ),
    );
  }
}
