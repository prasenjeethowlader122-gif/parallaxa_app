import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:rive/rive.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:any_link_preview/any_link_preview.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import '../../auth/data/auth_provider.dart';
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
    final authState = ref.read(authStateProvider);
    if (authState.isGuest) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please sign in to like posts.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
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
    final authState = ref.read(authStateProvider);
    if (authState.isGuest) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please sign in to bookmark posts.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _isSaved = !_isSaved);
  }

  Future<void> _toggleRepost() async {
    final authState = ref.read(authStateProvider);
    if (authState.isGuest) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please sign in to repost posts.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final captionController = TextEditingController();
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Repost'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add an optional caption to repost with thoughts:',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.mutedForeground,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: captionController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'What\'s on your mind?',
                  hintStyle: const TextStyle(color: Colors.grey),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(null),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop({
                  'repost': true,
                  'caption': captionController.text.trim(),
                });
              },
              child: const Text('Repost'),
            ),
          ],
        );
      },
    );

    if (result == null) return;

    final caption = result['caption'] as String?;

    if (_isReposting) return;
    setState(() {
      _isReposting = true;
      _repostCount += 1;
    });
    try {
      await ref
          .read(postRepositoryProvider)
          .repostPost(widget.post.id, content: caption);
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
    final isQuoteRepost =
        isRepost &&
        widget.post.content != null &&
        widget.post.content!.isNotEmpty;
    final displayPost = isRepost ? widget.post.repostOf! : widget.post;
    final mainPost = isQuoteRepost ? widget.post : displayPost;

    return GestureDetector(
      onTap: widget.onTap ?? () => context.push('/post/${mainPost.id}'),
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
            if (isRepost && !isQuoteRepost) ...[
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
                  onTap: () => context.push('/user/${mainPost.author.id}'),
                  child: UserAvatar(
                    uri: mainPost.author.avatarUrl,
                    size: 40,
                    hasStory: mainPost.author.hasStory,
                    hasUnviewedStory: mainPost.author.hasUnviewedStory,
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
                              onTap: () =>
                                  context.push('/user/${mainPost.author.id}'),
                              child: Text(
                                mainPost.author.displayName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                          if (mainPost.author.isVerified) ...[
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
                            '· ${_timeAgo(mainPost.createdAt)}',
                            style: TextStyle(
                              fontSize: 13,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '@${mainPost.author.username}',
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
            if (mainPost.content != null && mainPost.content!.isNotEmpty) ...[
              _ContentText(content: mainPost.content!),
              const SizedBox(height: 8),
            ],

            // Quote Repost Nested Card
            if (isQuoteRepost) _NestedOriginalPost(post: widget.post.repostOf!),

            // Image or Link Preview (for non-quote repost)
            if (!isQuoteRepost) ...[
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
    final iconColor = isLiked
        ? AppColors.like
        : theme.colorScheme.onSurfaceVariant;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        child: Row(
          children: [
            SizedBox(
              width: 28,
              height: 28,
              child: isLiked
                  ? RiveAnimation.asset(
                      'assets/rive/emoji.riv',
                      animations: ['look_up'],
                    )
                  : Icon(Symbols.favorite, size: 22, color: iconColor, fill: 0),
            ),
            if (count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 14,
                  color: iconColor,
                  fontWeight: isLiked ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NestedOriginalPost extends StatelessWidget {
  final Post post;
  const _NestedOriginalPost({required this.post});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(top: 8, bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              UserAvatar(uri: post.author.avatarUrl, size: 24),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  post.author.displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                '@${post.author.username}',
                style: TextStyle(
                  fontSize: 11,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (post.content != null && post.content!.isNotEmpty)
            Text(
              post.content!,
              style: const TextStyle(fontSize: 13),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          if (post.imageUrl != null) ...[
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: CachedNetworkImage(
                  imageUrl: post.imageUrl!,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ],
        ],
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
