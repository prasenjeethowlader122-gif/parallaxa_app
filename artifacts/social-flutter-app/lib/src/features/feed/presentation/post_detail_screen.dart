import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../auth/data/auth_repository.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../../core/app_colors.dart';
import '../../profile/presentation/widgets/user_avatar.dart';
import 'package:intl/intl.dart';

// ── Constants ─────────────────────────────────────────────────────────────────
const double parentAvatarSize = 38;
const double replyAvatarSize = 28;
const double gutterWidth = parentAvatarSize;
const double gutterGap = 10;
const double curveSvgHeight = 32;
const double replyRowTopPad = curveSvgHeight - (replyAvatarSize / 2); // 18

class PostDetailScreen extends ConsumerStatefulWidget {
  final String postId;

  const PostDetailScreen({super.key, required this.postId});

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final _commentController = TextEditingController();
  final _focusNode = FocusNode();
  bool _isSubmitting = false;
  String? _replyTargetId;
  String? _replyTargetUsername;

  @override
  void dispose() {
    _commentController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _submitComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    setState(() => _isSubmitting = true);
    try {
      await ref
          .read(postRepositoryProvider)
          .createPost(
            content: content,
            parentPostId: _replyTargetId ?? widget.postId,
          );
      _commentController.clear();
      setState(() {
        _replyTargetId = null;
        _replyTargetUsername = null;
      });
      ref.invalidate(postRepliesProvider(widget.postId));
      ref.invalidate(postDetailProvider(widget.postId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Failed to post comment')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _onReply(String commentId, String username) {
    setState(() {
      _replyTargetId = commentId;
      _replyTargetUsername = username;
    });
    _focusNode.requestFocus();
  }

  String _formatFullDate(DateTime dt) {
    return DateFormat('h:mm a · MMM d, y').format(dt);
  }

  String _fmtCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }

  @override
  Widget build(BuildContext context) {
    final postAsync = ref.watch(postDetailProvider(widget.postId));
    final repliesAsync = ref.watch(postRepliesProvider(widget.postId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Post'),
        centerTitle: true,
        leading: IconButton(
          icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(postDetailProvider(widget.postId));
                ref.invalidate(postRepliesProvider(widget.postId));
              },
              child: ListView(
                children: [
                  // Parent Post
                  postAsync.when(
                    data: (post) => _ParentPostView(
                      post: post,
                      onReply: () => _onReply(post.id, post.author.username),
                      formatDate: _formatFullDate,
                      fmtCount: _fmtCount,
                    ),
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    error: (e, _) => Center(child: Text('Error: $e')),
                  ),

                  // Replying to banner
                  if (_replyTargetUsername != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.05),
                        border: const Border(
                          bottom: BorderSide(
                            color: AppColors.border,
                            width: 0.5,
                          ),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text.rich(
                            TextSpan(
                              text: 'Replying to ',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.mutedForeground,
                              ),
                              children: [
                                TextSpan(
                                  text: '@$_replyTargetUsername',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setState(() {
                              _replyTargetId = null;
                              _replyTargetUsername = null;
                            }),
                            child: const Text(
                              'Cancel',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Replies
                  repliesAsync.when(
                    data: (page) {
                      final tree = _buildCommentTree(page.posts);
                      return Column(
                        children: tree
                            .map(
                              (comment) => _CommentItem(
                                comment: comment,
                                onReply: _onReply,
                                depth: 0,
                              ),
                            )
                            .toList(),
                      );
                    },
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    error: (e, _) => Center(child: Text('Error: $e')),
                  ),
                ],
              ),
            ),
          ),
          _CommentInput(
            controller: _commentController,
            focusNode: _focusNode,
            isSubmitting: _isSubmitting,
            onSend: _submitComment,
            replyTargetUsername: _replyTargetUsername,
          ),
        ],
      ),
    );
  }

  List<_CommentNode> _buildCommentTree(List<Post> flat) {
    final map = <String, _CommentNode>{};
    final roots = <_CommentNode>[];

    final sorted = [...flat]
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));

    for (var p in sorted) {
      map[p.id] = _CommentNode(p);
    }

    for (var p in sorted) {
      final node = map[p.id]!;
      if (p.parentPostId != null &&
          p.parentPostId != widget.postId &&
          map.containsKey(p.parentPostId)) {
        map[p.parentPostId]!.replies.add(node);
      } else {
        roots.add(node);
      }
    }
    return roots;
  }
}

class _CommentNode {
  final Post post;
  final List<_CommentNode> replies = [];
  _CommentNode(this.post);
}

// ── Parent Post View ───────────────────────────────────────────────────────────

class _ParentPostView extends StatelessWidget {
  final Post post;
  final VoidCallback onReply;
  final String Function(DateTime) formatDate;
  final String Function(int) fmtCount;

  const _ParentPostView({
    required this.post,
    required this.onReply,
    required this.formatDate,
    required this.fmtCount,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Author Row
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => context.push('/user/${post.author.id}'),
                child: UserAvatar(uri: post.author.avatarUrl, size: 44),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => context.push('/user/${post.author.id}'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              post.author.displayName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (post.author.isVerified) ...[
                            const SizedBox(width: 4),
                            const HugeIcon(
                              icon: HugeIcons.strokeRoundedCheckmarkBadge01,
                              size: 16,
                              color: AppColors.primary,
                            ),
                          ],
                        ],
                      ),
                      Text(
                        '@${post.author.username}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.mutedForeground,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const HugeIcon(
                icon: HugeIcons.strokeRoundedMoreHorizontal,
                size: 20,
                color: AppColors.mutedForeground,
              ),
            ],
          ),
        ),

        // Content
        if (post.content != null && post.content!.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Text(
              post.content!,
              style: const TextStyle(fontSize: 18, height: 1.4),
            ),
          ),

        // Image
        if (post.imageUrl != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: CachedNetworkImage(
                  imageUrl: post.imageUrl!,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),

        // Timestamp
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Text(
            formatDate(post.createdAt),
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.mutedForeground,
            ),
          ),
        ),

        const Divider(height: 1),

        // Stats
        if (post.likesCount > 0 || post.repliesCount > 0)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                if (post.repliesCount > 0) ...[
                  Text(
                    fmtCount(post.repliesCount),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    ' Replies',
                    style: TextStyle(color: AppColors.mutedForeground),
                  ),
                  const SizedBox(width: 16),
                ],
                if (post.likesCount > 0) ...[
                  Text(
                    fmtCount(post.likesCount),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    post.likesCount == 1 ? ' Like' : ' Likes',
                    style: const TextStyle(color: AppColors.mutedForeground),
                  ),
                ],
              ],
            ),
          ),

        if (post.likesCount > 0 || post.repliesCount > 0)
          const Divider(height: 1),

        // Actions
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              IconButton(
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedAiChat01,
                  color: AppColors.mutedForeground,
                ),
                onPressed: onReply,
              ),
              IconButton(
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedArrowUp01,
                  color: AppColors.mutedForeground,
                ),
                onPressed: () {},
              ),
              IconButton(
                icon: HugeIcon(
                  icon: post.isLiked
                      ? HugeIcons.strokeRoundedFavourite
                      : HugeIcons.strokeRoundedFavourite,
                  color: post.isLiked ? AppColors.like : AppColors.mutedForeground,
                ),
                onPressed: () {},
              ),
              IconButton(
                icon: HugeIcon(
                  icon: post.isSaved
                      ? HugeIcons.strokeRoundedBookmark01
                      : HugeIcons.strokeRoundedBookmark01,
                  color: post.isSaved ? AppColors.saved : AppColors.mutedForeground,
                ),
                onPressed: () {},
              ),
              IconButton(
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedShare01,
                  color: AppColors.mutedForeground,
                ),
                onPressed: () {},
              ),
            ],
          ),
        ),
        const Divider(height: 1),
      ],
    );
  }
}

// ── Comment Item ───────────────────────────────────────────────────────────────

class _CommentItem extends StatefulWidget {
  final _CommentNode comment;
  final Function(String, String) onReply;
  final int depth;

  const _CommentItem({
    required this.comment,
    required this.onReply,
    required this.depth,
  });

  @override
  State<_CommentItem> createState() => _CommentItemState();
}

class _CommentItemState extends State<_CommentItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final post = widget.comment.post;
    final hasReplies = widget.comment.replies.isNotEmpty;
    final avatarSize = widget.depth > 0 ? replyAvatarSize : parentAvatarSize;

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(
            14,
            widget.depth > 0 ? replyRowTopPad : 12,
            14,
            0,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Gutter
              SizedBox(
                width: gutterWidth,
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: () => context.push('/user/${post.author.id}'),
                      child: UserAvatar(
                        uri: post.author.avatarUrl,
                        size: avatarSize,
                      ),
                    ),
                    if (hasReplies && _isExpanded)
                      Container(
                        width: 2,
                        height: 20, // Simple straight line
                        margin: const EdgeInsets.only(top: 4),
                        decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(1),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: gutterGap),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () => context.push('/user/${post.author.id}'),
                      child: Row(
                        children: [
                          Flexible(
                            child: Text(
                              post.author.displayName,
                              style: TextStyle(
                                fontSize: widget.depth > 0 ? 13 : 14,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (post.author.isVerified) ...[
                            const SizedBox(width: 4),
                            HugeIcon(
                              icon: HugeIcons.strokeRoundedCheckmarkBadge01,
                              size: widget.depth > 0 ? 12 : 14,
                              color: AppColors.primary,
                            ),
                          ],
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '@${post.author.username} · ${_timeAgo(post.createdAt)}',
                              style: TextStyle(
                                fontSize: widget.depth > 0 ? 12 : 13,
                                color: AppColors.mutedForeground,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      post.content ?? '',
                      style: TextStyle(fontSize: widget.depth > 0 ? 13 : 14),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _CommentAction(
                          icon: HugeIcon(
                            icon: HugeIcons.strokeRoundedAiChat01,
                            color: AppColors.mutedForeground,
                            size: widget.depth > 0 ? 14 : 16,
                          ),
                          count: post.repliesCount,
                          onTap: () =>
                              widget.onReply(post.id, post.author.username),
                          size: widget.depth > 0 ? 14 : 16,
                        ),
                        const SizedBox(width: 20),
                        _CommentAction(
                          icon: HugeIcon(
                            icon: HugeIcons.strokeRoundedFavourite,
                            size: widget.depth > 0 ? 14 : 16,
                            color: post.isLiked
                                ? Colors.red
                                : AppColors.mutedForeground,
                          ),
                          count: post.likesCount,
                          onTap: () {},
                          size: widget.depth > 0 ? 14 : 16,
                          color: post.isLiked ? Colors.red : null,
                        ),
                        const SizedBox(width: 20),
                        _CommentAction(
                          icon: HugeIcon(
                            icon: HugeIcons.strokeRoundedShare01,
                            color: AppColors.mutedForeground,
                            size: widget.depth > 0 ? 14 : 16,
                          ),
                          count: 0,
                          onTap: () {},
                          size: widget.depth > 0 ? 14 : 16,
                        ),
                      ],
                    ),
                    if (hasReplies && !_isExpanded)
                      GestureDetector(
                        onTap: () => setState(() => _isExpanded = true),
                        child: Padding(
                          padding: const EdgeInsets.only(top: 10, bottom: 10),
                          child: Text(
                            widget.comment.replies.length > 1
                                ? 'View ${widget.comment.replies.length} replies'
                                : 'View reply',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Nested Replies
        if (_isExpanded && hasReplies)
          Column(
            children: widget.comment.replies.map((reply) {
              return Stack(
                children: [
                  // Curved Line
                  Positioned(
                    left: 14,
                    top: 0,
                    child: SizedBox(
                      width: gutterWidth,
                      height: curveSvgHeight,
                      child: CustomPaint(
                        painter: _CurvePainter(color: AppColors.border),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: gutterWidth + 4),
                    child: _CommentItem(
                      comment: reply,
                      onReply: widget.onReply,
                      depth: widget.depth + 1,
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        if (!_isExpanded || !hasReplies) const Divider(height: 1),
      ],
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

class _CommentAction extends StatelessWidget {
  final Widget icon;
  final int count;
  final VoidCallback onTap;
  final double size;
  final Color? color;

  const _CommentAction({
    required this.icon,
    required this.count,
    required this.onTap,
    this.size = 16,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          icon,
          if (count > 0) ...[
            const SizedBox(width: 4),
            Text(
              '$count',
              style: TextStyle(
                fontSize: size * 0.75,
                color: color ?? AppColors.mutedForeground,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CurvePainter extends CustomPainter {
  final Color color;
  _CurvePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;

    final path = Path();
    path.moveTo(size.width / 2, 0);
    path.lineTo(size.width / 2, 18);
    path.quadraticBezierTo(size.width / 2, 32, size.width, 32);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Comment Input ─────────────────────────────────────────────────────────────

class _CommentInput extends ConsumerWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool isSubmitting;
  final VoidCallback onSend;
  final String? replyTargetUsername;

  const _CommentInput({
    required this.controller,
    required this.focusNode,
    required this.isSubmitting,
    required this.onSend,
    this.replyTargetUsername,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(currentUserProvider).value;

    return Container(
      padding: EdgeInsets.only(
        left: 14,
        right: 14,
        top: 10,
        bottom: MediaQuery.of(context).padding.bottom + 10,
      ),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          UserAvatar(uri: me?.avatarUrl, size: 36),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              decoration: InputDecoration(
                hintText: replyTargetUsername != null
                    ? 'Reply to @$replyTargetUsername…'
                    : 'Post your reply',
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
              ),
              maxLines: 5,
              minLines: 1,
              style: const TextStyle(fontSize: 15),
            ),
          ),
          const SizedBox(width: 10),
          if (isSubmitting)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            ElevatedButton(
              onPressed: onSend,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(68, 36),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: const Text('Reply'),
            ),
        ],
      ),
    );
  }
}
