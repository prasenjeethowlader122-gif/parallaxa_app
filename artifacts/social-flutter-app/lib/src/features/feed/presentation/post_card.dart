import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../../core/app_colors.dart';

class PostCard extends ConsumerStatefulWidget {
  final Post post;
  final VoidCallback? onTap;

  const PostCard({super.key, required this.post, this.onTap});

  @override
  ConsumerState<PostCard> createState() => _PostCardState();
}

class _PostCardState extends ConsumerState<PostCard> {
  late bool _isLiked;
  late int _likesCount;
  late bool _isSaved;
  bool _isLiking = false;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _likesCount = widget.post.likesCount;
    _isSaved = widget.post.isSaved;
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }

  Future<void> _toggleLike() async {
    if (_isLiking) return;
    setState(() {
      _isLiking = true;
      _isLiked = !_isLiked;
      _likesCount += _isLiked ? 1 : -1;
    });
    try {
      final repo = ref.read(postRepositoryProvider);
      if (_isLiked) {
        await repo.likePost(widget.post.id);
      } else {
        await repo.unlikePost(widget.post.id);
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLiked = !_isLiked;
          _likesCount += _isLiked ? 1 : -1;
        });
      }
    } finally {
      if (mounted) setState(() => _isLiking = false);
    }
  }

  void _toggleSave() {
    setState(() => _isSaved = !_isSaved);
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    final repostCount = (_likesCount / 2.5).floor();

    return GestureDetector(
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.only(
            left: 16, right: 16, top: 16, bottom: 4),
        decoration: const BoxDecoration(
          color: AppColors.background,
          border: Border(
            bottom: BorderSide(color: AppColors.border, width: 0.5),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Avatar ──
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.muted,
                backgroundImage: post.author.avatarUrl != null
                    ? CachedNetworkImageProvider(post.author.avatarUrl!)
                    : null,
                child: post.author.avatarUrl == null
                    ? const Icon(Icons.person, size: 20,
                        color: AppColors.mutedForeground)
                    : null,
              ),
            ),
            // ── Right side ──
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Author row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    post.author.displayName,
                                    style: const TextStyle(
                                      fontFamily: 'Sora',
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: AppColors.foreground,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (post.author.isVerified) ...[
                                  const SizedBox(width: 3),
                                  const Icon(Icons.verified,
                                      size: 15, color: AppColors.verified),
                                ],
                              ],
                            ),
                            Text(
                              '@${post.author.username} · ${_timeAgo(post.createdAt)}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.mutedForeground,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.more_horiz,
                          size: 20, color: AppColors.mutedForeground),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Content
                  if (post.content != null) ...[
                    _ContentText(content: post.content!),
                    const SizedBox(height: 14),
                  ],

                  // Image
                  if (post.imageUrl != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: AspectRatio(
                        aspectRatio: 16 / 9,
                        child: CachedNetworkImage(
                          imageUrl: post.imageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                              color: AppColors.muted),
                          errorWidget: (_, __, ___) => Container(
                            color: AppColors.muted,
                            child: const Icon(Icons.broken_image,
                                color: AppColors.mutedForeground),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // ── Action row ──
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Reply
                      _ActionBtn(
                        icon: Icons.chat_bubble_outline_rounded,
                        count: post.repliesCount,
                        color: AppColors.mutedForeground,
                        onTap: () {},
                      ),
                      // Repost
                      _ActionBtn(
                        icon: Icons.repeat_rounded,
                        count: repostCount,
                        color: AppColors.mutedForeground,
                        onTap: () {},
                      ),
                      // Like
                      _ActionBtn(
                        icon: _isLiked
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        count: _likesCount,
                        color: _isLiked
                            ? AppColors.like
                            : AppColors.mutedForeground,
                        onTap: _toggleLike,
                      ),
                      // Bookmark
                      _ActionBtn(
                        icon: _isSaved
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        count: 0,
                        color: _isSaved
                            ? AppColors.saved
                            : AppColors.mutedForeground,
                        onTap: _toggleSave,
                        showCount: false,
                      ),
                      // Share
                      _ActionBtn(
                        icon: Icons.ios_share_rounded,
                        count: 0,
                        color: AppColors.mutedForeground,
                        onTap: () {},
                        showCount: false,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContentText extends StatelessWidget {
  final String content;

  const _ContentText({required this.content});

  @override
  Widget build(BuildContext context) {
    final parts = content.split(
        RegExp(r'((?:@|#)\w+|https?://[^\s]+)'));
    final spans = <InlineSpan>[];
    for (final part in parts) {
      if (part.startsWith('#') ||
          part.startsWith('@') ||
          part.startsWith('http')) {
        spans.add(TextSpan(
          text: part,
          style: const TextStyle(color: AppColors.primary),
        ));
      } else {
        spans.add(TextSpan(text: part));
      }
    }
    return Text.rich(
      TextSpan(children: spans),
      style: const TextStyle(
        fontFamily: 'Sora',
        fontSize: 15,
        height: 1.4,
        color: AppColors.foreground,
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final int count;
  final Color color;
  final VoidCallback? onTap;
  final bool showCount;

  const _ActionBtn({
    required this.icon,
    required this.count,
    required this.color,
    this.onTap,
    this.showCount = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            if (showCount && count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 13,
                  color: color,
                  fontFamily: 'Sora',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
