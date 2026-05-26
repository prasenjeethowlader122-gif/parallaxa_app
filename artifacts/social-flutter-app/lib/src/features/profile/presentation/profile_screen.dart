import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:go_router/go_router.dart';
import '../../auth/domain/user.dart';
import '../../feed/domain/post.dart';
import '../../feed/presentation/post_card.dart';
import '../data/profile_repository.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/api_client.dart';
import '../../../core/processing_provider.dart';
import '../../../core/localization_provider.dart';
import '../../../core/app_colors.dart';
import '../../../core/widgets/ad_banner_widget.dart';
import 'widgets/user_avatar.dart';

final userProfileProvider = FutureProvider.family<User, String>((ref, userId) {
  return ref.watch(profileRepositoryProvider).getUserProfile(userId);
});

final userPostsProvider = FutureProvider.family<PostPage, String>((
  ref,
  userId,
) {
  return ref.watch(profileRepositoryProvider).getUserPosts(userId);
});

class ProfileScreen extends ConsumerStatefulWidget {
  final String userId;

  const ProfileScreen({super.key, required this.userId});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen>
    with SingleTickerProviderStateMixin {
  bool? _isFollowing;
  bool _isFollowLoading = false;
  late final TabController _tab;

  String get effectiveUserId => widget.userId;

  bool get isOwnProfile {
    final storage = ref.read(storageServiceProvider);
    final currentId = storage.getCurrentUserId();
    return widget.userId == 'me' || widget.userId == currentId;
  }

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
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
      if (mounted) setState(() => _isFollowing = !_isFollowing!);
    } finally {
      if (mounted) setState(() => _isFollowLoading = false);
    }
  }

  Future<void> _logout() async {
    ref.read(processingProvider.notifier).show("Logging out...");
    try {
      await ref.read(authRepositoryProvider).logout();
    } catch (_) {}
    await ref.read(storageServiceProvider).clearAll();
    ref.read(processingProvider.notifier).hide();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    final theme = Theme.of(context);
    final tabs = [
      l10n.get('posts'),
      l10n.get('replies'),
      l10n.get('media'),
      l10n.get('likes'),
    ];
    final userAsync = ref.watch(userProfileProvider(effectiveUserId));
    final postsAsync = ref.watch(userPostsProvider(effectiveUserId));

    return Scaffold(
      body: userAsync.when(
        loading: () => Center(
          child: CircularProgressIndicator(
            color: theme.colorScheme.primary,
            strokeWidth: 2,
          ),
        ),
        error: (context, error) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Symbols.error,
                size: 40,
                color: theme.colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 12),
              Text(
                'Could not load profile',
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () =>
                    ref.invalidate(userProfileProvider(effectiveUserId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (user) {
          return RefreshIndicator(
            color: theme.colorScheme.primary,
            onRefresh: () async {
              ref.invalidate(userProfileProvider(effectiveUserId));
              ref.invalidate(userPostsProvider(effectiveUserId));
            },
            child: NestedScrollView(
              headerSliverBuilder: (context, _) => [
                SliverToBoxAdapter(
                  child: _ProfileHeader(
                    user: user,
                    isOwnProfile: isOwnProfile,
                    isFollowing: _isFollowing ?? false,
                    isFollowLoading: _isFollowLoading,
                    onFollow: () => _toggleFollow(user),
                    onLogout: _logout,
                    l10n: l10n,
                  ),
                ),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _TabBarDelegate(
                    TabBar(
                      controller: _tab,
                      tabs: tabs.map((t) => Tab(text: t)).toList(),
                      labelStyle: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                      unselectedLabelStyle: const TextStyle(
                        fontWeight: FontWeight.w400,
                        fontSize: 14,
                      ),
                      labelColor: theme.colorScheme.onSurface,
                      unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
                      indicatorColor: theme.colorScheme.primary,
                      indicatorWeight: 3,
                      indicatorSize: TabBarIndicatorSize.label,
                      splashFactory: NoSplash.splashFactory,
                      overlayColor: WidgetStateProperty.all(Colors.transparent),
                      dividerColor: Colors.transparent,
                    ),
                  ),
                ),
              ],
              body: TabBarView(
                controller: _tab,
                children: [
                  _PostsList(
                    postsAsync: postsAsync,
                    isOwnProfile: isOwnProfile,
                  ),
                  const _EmptyTab(
                    icon: Symbols.chat,
                    message: 'No replies yet',
                  ),
                  _PostsList(
                    postsAsync: postsAsync,
                    mediaOnly: true,
                    isOwnProfile: isOwnProfile,
                    l10n: l10n,
                  ),
                  const _EmptyTab(
                    icon: Symbols.favorite,
                    message: 'No liked posts yet',
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final User user;
  final bool isOwnProfile;
  final bool isFollowing;
  final bool isFollowLoading;
  final VoidCallback onFollow;
  final VoidCallback onLogout;
  final L10n l10n;

  const _ProfileHeader({
    required this.user,
    required this.isOwnProfile,
    required this.isFollowing,
    required this.isFollowLoading,
    required this.onFollow,
    required this.onLogout,
    required this.l10n,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SizedBox(width: 48),
              Expanded(
                child: Text(
                  user.displayName,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 17,
                    color: theme.colorScheme.onSurface,
                  ),
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isOwnProfile)
                IconButton(
                  icon: const Icon(Symbols.logout, size: 22),
                  onPressed: onLogout,
                  color: theme.colorScheme.onSurface,
                )
              else
                IconButton(
                  icon: const Icon(Symbols.more_horiz, size: 22),
                  onPressed: () =>
                      context.push('/profile/options', extra: user),
                  color: theme.colorScheme.onSurface,
                ),
            ],
          ),
        ),

        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 158,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: theme.brightness == Brightness.dark
                      ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                      : [const Color(0xFFCFD9DE), const Color(0xFF9DB8C4)],
                ),
              ),
            ),
          ),
        ),

        Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 16, 0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Transform.translate(
                offset: const Offset(0, -38),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: theme.scaffoldBackgroundColor,
                      width: 3,
                    ),
                  ),
                  child: UserAvatar(
                    uri: user.avatarUrl,
                    size: 76,
                    hasStory: user.hasStory,
                    hasUnviewedStory: user.hasUnviewedStory,
                  ),
                ),
              ),
              const Spacer(),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: isOwnProfile
                    ? OutlinedButton(
                        onPressed: () =>
                            context.push('/profile/edit', extra: user),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                            color: theme.dividerColor,
                            width: 1.2,
                          ),
                          shape: const StadiumBorder(),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 8,
                          ),
                          minimumSize: Size.zero,
                          foregroundColor: theme.colorScheme.onSurface,
                        ),
                        child: Text(
                          l10n.get('edit_profile'),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      )
                    : Row(
                        children: [
                          OutlinedButton(
                            onPressed: () =>
                                context.push('/messages/start', extra: user),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: theme.dividerColor,
                                width: 1.2,
                              ),
                              shape: const StadiumBorder(),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              minimumSize: Size.zero,
                              foregroundColor: theme.colorScheme.onSurface,
                            ),
                            child: Text(
                              l10n.get('message'),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (isFollowLoading)
                            SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: theme.colorScheme.primary,
                              ),
                            )
                          else
                            ElevatedButton(
                              onPressed: onFollow,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isFollowing
                                    ? theme.scaffoldBackgroundColor
                                    : theme.colorScheme.onSurface,
                                foregroundColor: isFollowing
                                    ? theme.colorScheme.onSurface
                                    : theme.colorScheme.surface,
                                side: isFollowing
                                    ? BorderSide(
                                        color: theme.dividerColor,
                                        width: 1.2,
                                      )
                                    : BorderSide.none,
                                elevation: 0,
                                shape: const StadiumBorder(),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 8,
                                ),
                                minimumSize: Size.zero,
                              ),
                              child: Text(
                                isFollowing
                                    ? l10n.get('following')
                                    : l10n.get('follow'),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                        ],
                      ),
              ),
            ],
          ),
        ),

        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    user.displayName,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 19,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  if (user.isVerified) ...[
                    const SizedBox(width: 4),
                    const Icon(
                      Symbols.verified,
                      size: 18,
                      color: AppColors.verified,
                      fill: 1,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 2),
              Text(
                '@${user.username}',
                style: TextStyle(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              if (user.bio != null && user.bio!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  user.bio!,
                  style: TextStyle(
                    fontSize: 15,
                    color: theme.colorScheme.onSurface,
                    height: 1.4,
                  ),
                ),
              ],
              if (user.website != null && user.website!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      Symbols.link,
                      size: 16,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      user.website!,
                      style: TextStyle(
                        color: theme.colorScheme.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 14),

              Row(
                children: [
                  _StatChip(
                    count: user.followingCount,
                    label: l10n.get('following'),
                  ),
                  const SizedBox(width: 16),
                  _StatChip(
                    count: user.followersCount,
                    label: l10n.get('followers'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  final int count;
  final String label;

  const _StatChip({required this.count, required this.label});

  String _fmt(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _fmt(count),
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  const _TabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height + 0.5;

  @override
  double get maxExtent => tabBar.preferredSize.height + 0.5;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
      ),
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate oldDelegate) => false;
}

class _PostsList extends StatelessWidget {
  final AsyncValue<PostPage> postsAsync;
  final bool mediaOnly;
  final bool isOwnProfile;
  final L10n? l10n;

  const _PostsList({
    required this.postsAsync,
    this.mediaOnly = false,
    required this.isOwnProfile,
    this.l10n,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return postsAsync.when(
      loading: () => Center(
        child: CircularProgressIndicator(
          color: theme.colorScheme.primary,
          strokeWidth: 2,
        ),
      ),
      error: (context, error) => Center(
        child: Text(
          'Could not load posts',
          style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
        ),
      ),
      data: (page) {
        final posts = mediaOnly
            ? page.posts.where((p) => p.imageUrl != null).toList()
            : page.posts;

        if (posts.isEmpty) {
          return _EmptyTab(
            icon: mediaOnly ? Symbols.image : Symbols.notes,
            message: mediaOnly ? 'No media yet' : 'No posts yet',
          );
        }

        final showAd = !isOwnProfile;

        return ListView.separated(
          padding: EdgeInsets.zero,
          itemCount: posts.length + (showAd ? 1 : 0),
          separatorBuilder: (context, index) =>
              const Divider(height: 0.5, thickness: 0.5),
          itemBuilder: (context, i) {
            if (showAd && i == 0) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Center(child: AdBannerWidget()),
              );
            }
            final postIndex = showAd ? i - 1 : i;
            return PostCard(post: posts[postIndex]);
          },
        );
      },
    );
  }
}

class _EmptyTab extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyTab({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 44,
            color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
          ),
          const SizedBox(height: 14),
          Text(
            message,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
