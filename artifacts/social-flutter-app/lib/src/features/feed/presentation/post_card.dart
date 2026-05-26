import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:rive/rive.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:any_link_preview/any_link_preview.dart';
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
      _repostCount += 1;
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

  String? _extractUrl(String text) {
    final urlRegExp = RegExp(
      r'((https?|ftp)://[^\s/$.?#].[^\s]*)',
      caseSensitive: false,
    );
    final match = urlRegExp.firstMatch(text);
    return match?.group(0);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final theme = Theme.of(context);

    final isRepost = widget.post.repostOf != null;
    final displayPost = isRepost ? widget.post.repostOf! : widget.post;

    return GestureDetector(
      onTap: widget.onTap ?? () => context.push('/post/${displayPost.id}'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          border: Border(
            bottom: BorderSide(color: theme.dividerColor, width: 0.5),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isRepost) ...[
              Padding(
                padding: const EdgeInsets.only(left: 32, bottom: 8),
                child: Row(
                  children: [
                    Icon(
                      Symbols.repeat,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${widget.post.author.displayName} ${l10n.get('reposted')}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => context.push('/user/${displayPost.author.id}'),
                  child: UserAvatar(
                    uri: displayPost.author.avatarUrl,
                    size: 40,
                    hasStory: displayPost.author.hasStory,
                    hasUnviewedStory: displayPost.author.hasUnviewedStory,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: GestureDetector(
                              onTap: () => context.push(
                                '/user/${displayPost.author.id}',
                              ),
                              child: Text(
                                displayPost.author.displayName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                          if (displayPost.author.isVerified) ...[
                            const SizedBox(width: 4),
                            const Icon(
                              Symbols.verified,
                              size: 16,
                              color: AppColors.verified,
                              fill: 1,
                            ),
                          ],
                          const SizedBox(width: 4),
                          Text(
                            '· ${_timeAgo(displayPost.createdAt)}',
                            style: TextStyle(
                              fontSize: 13,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '@${displayPost.author.username}',
                        style: TextStyle(
                          fontSize: 13,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Symbols.more_horiz, size: 20),
                  onPressed: () {},
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  visualDensity: VisualDensity.compact,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Content
            if (displayPost.content != null &&
                displayPost.content!.isNotEmpty) ...[
              _ContentText(content: displayPost.content!),
              const SizedBox(height: 8),
            ],

            // Image or Link Preview
            if (displayPost.imageUrl != null) ...[
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: GestureDetector(
                  onLongPress: () => context.push(
                    '/image-preview',
                    extra: displayPost.imageUrl,
                  ),
                  child: CachedNetworkImage(
                    imageUrl: displayPost.imageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: theme.colorScheme.surfaceContainerHighest,
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: const Icon(Symbols.image),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ] else if (displayPost.content != null) ...[
              Builder(
                builder: (context) {
                  final url = _extractUrl(displayPost.content!);
                  if (url != null) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 4.0, bottom: 8.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: AnyLinkPreview(
                          link: url,
                          cache: const Duration(days: 7),
                          backgroundColor: theme.colorScheme.surfaceContainer,
                          errorWidget: const SizedBox.shrink(),
                          boxShadow: const [],
                          titleStyle: TextStyle(
                            color: theme.colorScheme.onSurface,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                          bodyStyle: TextStyle(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],

            // ── Action row ──
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _ActionItem(
                    icon: Symbols.chat,
                    count: displayPost.repliesCount,
                    onTap: () {},
                  ),
                  _ActionItem(
                    icon: Symbols.repeat,
                    count: _repostCount,
                    onTap: _toggleRepost,
                  ),
                  _LikeAction(
                    isLiked: _isLiked,
                    count: _likesCount,
                    onTap: _toggleLike,
                  ),
                  _ActionItem(
                    icon: Symbols.bookmark,
                    count: 0,
                    color: _isSaved ? AppColors.saved : null,
                    onTap: _toggleSave,
                    showCount: false,
                    isFilled: _isSaved,
                  ),
                  _ActionItem(
                    icon: Symbols.share,
                    count: 0,
                    onTap: () {},
                    showCount: false,
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

class _ContentText extends StatelessWidget {
  final String content;

  const _ContentText({required this.content});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final parts = content.split(RegExp(r'((?:@|#)\w+|(?:https?://[^\s]+))'));
    final spans = <InlineSpan>[];
    for (final part in parts) {
      if (part.startsWith('#') ||
          part.startsWith('@') ||
          part.startsWith('http')) {
        spans.add(
          TextSpan(
            text: part,
            style: const TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      } else {
        spans.add(TextSpan(text: part));
      }
    }
    return Text.rich(
      TextSpan(children: spans),
      style: TextStyle(
        fontSize: 15,
        height: 1.4,
        color: theme.colorScheme.onSurface,
      ),
    );
  }
}

class _LikeAction extends StatelessWidget {
  final bool isLiked;
  final int count;
  final VoidCallback onTap;

  const _LikeAction({
    required this.isLiked,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final iconColor = isLiked ? AppColors.like : theme.colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            SizedBox(
              width: 24,
              height: 24,
              child: isLiked
                  ? const RiveAnimation.asset(
                      'assets/rive/emoji.riv',
                      animations: ['look_up'],
                    )
                  : Icon(
                      Symbols.favorite,
                      size: 20,
                      color: iconColor,
                      fill: 0,
                    ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 13,
                  color: iconColor,
                  fontWeight: isLiked ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final int count;
  final Color? color;
  final VoidCallback onTap;
  final bool showCount;
  final bool isFilled;

  const _ActionItem({
    required this.icon,
    required this.count,
    this.color,
    required this.onTap,
    this.showCount = true,
    this.isFilled = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final iconColor = color ?? theme.colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Icon(icon, size: 20, color: iconColor, fill: isFilled ? 1 : 0),
            if (showCount && count > 0) ...[
              const SizedBox(width: 6),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 13,
                  color: iconColor,
                  fontWeight: isFilled ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
