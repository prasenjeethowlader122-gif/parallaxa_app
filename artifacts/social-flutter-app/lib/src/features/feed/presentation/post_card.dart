import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../../core/app_colors.dart';
import '../../../core/localization_provider.dart';
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
  late int _repostCount;
  bool _isLiking = false;
  bool _isReposting = false;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _likesCount = widget.post.likesCount;
    _isSaved = widget.post.isSaved;
    _repostCount = widget.post.repostsCount;
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

  Future<void> _toggleRepost() async {
    if (_isReposting) return;
    setState(() {
      _isReposting = true;
      _repostCount += 1; // Optimistic
    });
    try {
      await ref.read(postRepositoryProvider).repostPost(widget.post.id);
    } catch (e) {
      if (mounted) {
        setState(() => _repostCount -= 1);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to repost: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isReposting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final post = widget.post.repostOf ?? widget.post;
    final isRepost = widget.post.repostOf != null;

    return GestureDetector(
      onTap: widget.onTap ?? () => context.push('/post/${post.id}'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: const BoxDecoration(color: AppColors.background),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isRepost) ...[
              Row(
                children: [
                  const SizedBox(width: 42),
                  const HugeIcon(
                    icon: HugeIcons.strokeRoundedRepeat,
                    size: 14,
                    color: AppColors.mutedForeground,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${widget.post.author.displayName} ${l10n.get('reposted')}',
                    style: const TextStyle(
                      fontFamily: 'Ubuntu',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.mutedForeground,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            // ── Author row ──
            Row(
              children: [
                GestureDetector(
                  onTap: () => context.push('/user/${post.author.id}'),
                  child: UserAvatar(
                    uri: post.author.avatarUrl,
                    size: 40,
                    hasStory: post.author.hasStory,
                    hasUnviewedStory: post.author.hasUnviewedStory,
                  ),
                ),
                const SizedBox(width: 10),
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
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: AppColors.foreground,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (post.author.isVerified) ...[
                              const SizedBox(width: 4),
                              const HugeIcon(
                                icon: HugeIcons.strokeRoundedCheckmarkBadge01,
                                size: 15,
                                color: AppColors.verified,
                              ),
                            ],
                          ],
                        ),
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
                const HugeIcon(
                  icon: HugeIcons.strokeRoundedMoreHorizontal,
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
                  child: GestureDetector(
                    onLongPress: () =>
                        context.push('/image-preview', extra: post.imageUrl),
                    child: CachedNetworkImage(
                      imageUrl: post.imageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.muted),
                      errorWidget: (_, __, ___) => Container(
                        color: AppColors.muted,
                        child: const HugeIcon(
                          icon: HugeIcons.strokeRoundedImage01,
                          color: AppColors.mutedForeground,
                        ),
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
                  icon: HugeIcons.strokeRoundedChat01,
                  count: post.repliesCount,
                  color: AppColors.mutedForeground,
                  onTap: () {},
                ),
                _ActionItem(
                  icon: HugeIcons.strokeRoundedRepeat,
                  count: _repostCount,
                  color: AppColors.mutedForeground,
                  onTap: _toggleRepost,
                ),
                _ActionItem(
                  icon: HugeIcons.strokeRoundedFavourite,
                  count: _likesCount,
                  color: _isLiked ? AppColors.like : AppColors.mutedForeground,
                  onTap: _toggleLike,
                ),
                _ActionItem(
                  icon: HugeIcons.strokeRoundedBookmark01,
                  count: 0,
                  color: _isSaved ? AppColors.saved : AppColors.mutedForeground,
                  onTap: _toggleSave,
                  showCount: false,
                ),
                _ActionItem(
                  icon: HugeIcons.strokeRoundedShare01,
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
        fontSize: 15,
        height: 1.4,
        color: AppColors.foreground,
      ),
    );
  }
}

class _ActionItem extends StatelessWidget {
  final dynamic icon;
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
            icon is IconData
                ? Icon(icon as IconData, size: 20, color: color)
                : HugeIcon(icon: icon, size: 20, color: color),
            if (showCount && count > 0) ...[
              const SizedBox(width: 6),
              Text('$count', style: TextStyle(fontSize: 13, color: color)),
            ],
          ],
        ),
      ),
    );
  }
}
