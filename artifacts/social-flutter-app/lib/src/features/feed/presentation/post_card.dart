import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../../core/app_colors.dart';
import '../../profile/presentation/widgets/user_avatar.dart';

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
      onTap: widget.onTap ?? () => context.push('/post/${post.id}'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: const BoxDecoration(
          color: AppColors.background,
          border: Border(
            bottom: BorderSide(color: AppColors.border, width: 0.5),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Author row ──
            Row(
              children: [
                UserAvatar(
                  uri: post.author.avatarUrl,
                  size: 40,
                  hasStory:
                      false, // In a real app, this would come from a story state
                  hasUnviewedStory: false,
                ),
                const SizedBox(width: 10),
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
                            const SizedBox(width: 4),
                            const Icon(
                              CupertinoIcons.checkmark_seal_fill,
                              size: 15,
                              color: AppColors.verified,
                            ),
                          ],
                        ],
                      ),
                      Text(
                        '@${post.author.username} · ${_timeAgo(post.createdAt)}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.mutedForeground,
                          fontFamily: 'Sora',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const Icon(
                  CupertinoIcons.ellipsis,
                  size: 20,
                  color: AppColors.mutedForeground,
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Content
            if (post.content != null && post.content!.isNotEmpty) ...[
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
                    placeholder: (_, __) => Container(color: AppColors.muted),
                    errorWidget: (_, __, ___) => Container(
                      color: AppColors.muted,
                      child: const Icon(
                        CupertinoIcons.photo,
                        color: AppColors.mutedForeground,
                      ),
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
                _ActionItem(
                  icon: CupertinoIcons.chat_bubble,
                  count: post.repliesCount,
                  color: AppColors.mutedForeground,
                  onTap: () {},
                ),
                _ActionItem(
                  icon: CupertinoIcons.arrow_2_squarepath,
                  count: repostCount,
                  color: AppColors.mutedForeground,
                  onTap: () {},
                ),
                _ActionItem(
                  icon: _isLiked
                      ? CupertinoIcons.heart_fill
                      : CupertinoIcons.heart,
                  count: _likesCount,
                  color: _isLiked ? AppColors.like : AppColors.mutedForeground,
                  onTap: _toggleLike,
                ),
                _ActionItem(
                  icon: _isSaved
                      ? CupertinoIcons.bookmark_fill
                      : CupertinoIcons.bookmark,
                  count: 0,
                  color: _isSaved ? AppColors.saved : AppColors.mutedForeground,
                  onTap: _toggleSave,
                  showCount: false,
                ),
                _ActionItem(
                  icon: CupertinoIcons.share,
                  count: 0,
                  color: AppColors.mutedForeground,
                  onTap: () {},
                  showCount: false,
                ),
              ],
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
    final parts = content.split(RegExp(r'((?:@|#)\w+|(?:https?://[^\s]+))'));
    final spans = <InlineSpan>[];
    for (final part in parts) {
      if (part.startsWith('#') ||
          part.startsWith('@') ||
          part.startsWith('http')) {
        spans.add(
          TextSpan(
            text: part,
            style: const TextStyle(color: AppColors.primary),
          ),
        );
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

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final int count;
  final Color color;
  final VoidCallback onTap;
  final bool showCount;

  const _ActionItem({
    required this.icon,
    required this.count,
    required this.color,
    required this.onTap,
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
          children: [
            Icon(icon, size: 20, color: color),
            if (showCount && count > 0) ...[
              const SizedBox(width: 6),
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
