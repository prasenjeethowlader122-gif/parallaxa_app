import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../auth/domain/user.dart';
import '../../feed/domain/post.dart';
import '../data/profile_repository.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/storage_service.dart';

final userProfileProvider =
    FutureProvider.family<User, String>((ref, userId) {
  return ref.watch(profileRepositoryProvider).getUserProfile(userId);
});

final userPostsProvider =
    FutureProvider.family<PostPage, String>((ref, userId) {
  return ref.watch(profileRepositoryProvider).getUserPosts(userId);
});

class ProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const ProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool? _isFollowing;
  bool _isFollowLoading = false;

  String get effectiveUserId => widget.userId;

  bool get isOwnProfile {
    final storageService = ref.read(storageServiceProvider);
    final currentId = storageService.getCurrentUserId();
    return widget.userId == 'me' || widget.userId == currentId;
  }

  Future<void> _toggleFollow(User user) async {
    if (_isFollowLoading) return;
    setState(() {
      _isFollowLoading = true;
      _isFollowing = !(_isFollowing ?? false);
    });
    try {
      final repo = ref.read(profileRepositoryProvider);
      if (_isFollowing!) {
        await repo.followUser(user.id);
      } else {
        await repo.unfollowUser(user.id);
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isFollowing = !_isFollowing!);
      }
    } finally {
      if (mounted) setState(() => _isFollowLoading = false);
    }
  }

  Future<void> _logout() async {
    try {
      final authRepo = ref.read(authRepositoryProvider);
      await authRepo.logout();
    } catch (_) {}
    final storage = ref.read(storageServiceProvider);
    await storage.clearAll();
    if (mounted) {
      Navigator.of(context)
          .pushNamedAndRemoveUntil('/login', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProfileProvider(effectiveUserId));
    final postsAsync = ref.watch(userPostsProvider(effectiveUserId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: userAsync.when(
          data: (user) => Text(
            '@${user.username}',
            style: const TextStyle(
              color: Colors.black,
              fontFamily: 'Sora',
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          loading: () => const Text('Loading...', style: TextStyle(color: Colors.black)),
          error: (_, __) => const Text('Profile', style: TextStyle(color: Colors.black)),
        ),
        actions: [
          if (isOwnProfile)
            IconButton(
              icon: const Icon(Icons.logout, color: Colors.black),
              onPressed: _logout,
              tooltip: 'Log out',
            ),
        ],
      ),
      body: userAsync.when(
        data: (user) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(userProfileProvider(effectiveUserId));
            ref.invalidate(userPostsProvider(effectiveUserId));
          },
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: _buildHeader(context, user),
              ),
              const SliverToBoxAdapter(
                child: Divider(height: 1),
              ),
              postsAsync.when(
                data: (page) => page.posts.isEmpty
                    ? const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(40),
                          child: Center(
                            child: Text(
                              'No posts yet',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        ),
                      )
                    : SliverGrid(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) =>
                              _PostGridTile(post: page.posts[index]),
                          childCount: page.posts.length,
                        ),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 2,
                          mainAxisSpacing: 2,
                        ),
                      ),
                loading: () => const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
                error: (_, __) => const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(
                        child: Text('Could not load posts',
                            style: TextStyle(color: Colors.grey))),
                  ),
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 40, color: Colors.grey),
              const SizedBox(height: 8),
              Text('Could not load profile',
                  style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(userProfileProvider(effectiveUserId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, User user) {
    final following = _isFollowing ?? false;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: Colors.grey.shade200,
                backgroundImage: user.avatarUrl != null
                    ? CachedNetworkImageProvider(user.avatarUrl!)
                    : null,
                child: user.avatarUrl == null
                    ? const Icon(Icons.person, size: 40, color: Colors.grey)
                    : null,
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _StatColumn('Posts', user.postsCount),
                    _StatColumn('Followers', user.followersCount),
                    _StatColumn('Following', user.followingCount),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                user.displayName,
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 15),
              ),
              if (user.isVerified) ...[
                const SizedBox(width: 4),
                const Icon(Icons.verified,
                    size: 16, color: Color(0xFF0095F6)),
              ],
            ],
          ),
          if (user.bio != null && user.bio!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(user.bio!,
                style: const TextStyle(fontSize: 14, height: 1.4)),
          ],
          if (user.website != null && user.website!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.link, size: 14, color: Color(0xFF0095F6)),
                const SizedBox(width: 4),
                Text(
                  user.website!,
                  style: const TextStyle(
                      color: Color(0xFF0095F6), fontSize: 13),
                ),
              ],
            ),
          ],
          const SizedBox(height: 14),
          if (!isOwnProfile)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isFollowLoading ? null : () => _toggleFollow(user),
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      following ? Colors.white : const Color(0xFF0095F6),
                  foregroundColor:
                      following ? Colors.black : Colors.white,
                  side: following
                      ? const BorderSide(color: Colors.grey)
                      : BorderSide.none,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: _isFollowLoading
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(following ? 'Following' : 'Follow'),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String label;
  final int count;

  const _StatColumn(this.label, this.count);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          _format(count),
          style: const TextStyle(
              fontSize: 18, fontWeight: FontWeight.bold),
        ),
        Text(label,
            style: const TextStyle(color: Colors.grey, fontSize: 13)),
      ],
    );
  }

  String _format(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }
}

class _PostGridTile extends StatelessWidget {
  final Post post;

  const _PostGridTile({required this.post});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade100,
      child: post.imageUrl != null
          ? CachedNetworkImage(
              imageUrl: post.imageUrl!,
              fit: BoxFit.cover,
              placeholder: (_, __) => Container(color: Colors.grey.shade200),
              errorWidget: (_, __, ___) =>
                  const Icon(Icons.broken_image, color: Colors.grey),
            )
          : Container(
              color: Colors.grey.shade100,
              alignment: Alignment.center,
              padding: const EdgeInsets.all(8),
              child: Text(
                post.content ?? '',
                style: const TextStyle(fontSize: 11),
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
              ),
            ),
    );
  }
}
