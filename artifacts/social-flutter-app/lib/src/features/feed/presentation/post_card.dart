import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';

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
  bool _isLiking = false;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _likesCount = widget.post.likesCount;
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

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return DateFormat('MMM d').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    return InkWell(
      onTap: widget.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: Colors.grey.shade200,
                  backgroundImage: post.author.avatarUrl != null
                      ? CachedNetworkImageProvider(post.author.avatarUrl!)
                      : null,
                  child: post.author.avatarUrl == null
                      ? const Icon(Icons.person, size: 20, color: Colors.grey)
                      : null,
                ),
                const SizedBox(width: 12),
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
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (post.author.isVerified) ...[
                            const SizedBox(width: 4),
                            const Icon(Icons.verified,
                                size: 14, color: Color(0xFF0095F6)),
                          ],
                          const SizedBox(width: 4),
                          Text(
                            '@${post.author.username}',
                            style: TextStyle(
                                color: Colors.grey.shade500, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '· ${_formatTime(post.createdAt)}',
                            style: TextStyle(
                                color: Colors.grey.shade500, fontSize: 13),
                          ),
                        ],
                      ),
                      if (post.content != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          post.content!,
                          style: const TextStyle(fontSize: 14, height: 1.4),
                        ),
                      ],
                      if (post.imageUrl != null) ...[
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(
                            imageUrl: post.imageUrl!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            placeholder: (context, url) => Container(
                              height: 200,
                              color: Colors.grey.shade100,
                              child: const Center(
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2)),
                            ),
                            errorWidget: (context, url, error) => Container(
                              height: 200,
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.broken_image,
                                  color: Colors.grey),
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _ActionButton(
                            icon: _isLiked
                                ? Icons.favorite
                                : Icons.favorite_border,
                            label: '$_likesCount',
                            color: _isLiked ? Colors.red : Colors.grey,
                            onTap: _toggleLike,
                          ),
                          const SizedBox(width: 24),
                          _ActionButton(
                            icon: Icons.chat_bubble_outline,
                            label: '${post.repliesCount}',
                            color: Colors.grey,
                            onTap: null,
                          ),
                          const Spacer(),
                          Icon(
                            post.isSaved
                                ? Icons.bookmark
                                : Icons.bookmark_border,
                            size: 18,
                            color: Colors.grey,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
        ],
      ),
    );
  }
}
