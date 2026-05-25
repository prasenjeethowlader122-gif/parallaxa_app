import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/profile_repository.dart';
import '../../feed/data/post_repository.dart';
import '../../feed/presentation/post_card.dart';
import '../../feed/domain/post.dart';
import '../../auth/domain/user.dart';
import '../../auth/data/auth_repository.dart';
import '../../../core/app_colors.dart';
import '../../../core/localization_provider.dart';
import 'widgets/user_avatar.dart';

final userProfileProvider = FutureProvider.family<User, String>((ref, userId) {
  if (userId == 'me') return ref.watch(authRepositoryProvider).getMe();
  return ref.watch(profileRepositoryProvider).getUserProfile(userId);
});

final userPostsProvider = FutureProvider.family<PostPage, String>((ref, userId) {
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
  late final TabController _tab;

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

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider(widget.userId));
    final postsAsync = ref.watch(userPostsProvider(widget.userId));
    final l10n = ref.watch(l10nProvider);
    final isOwnProfile = widget.userId == 'me';

    return profileAsync.when(
      data: (user) => Scaffold(
        backgroundColor: AppColors.background,
        body: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              _ProfileHeader(user: user, isOwnProfile: isOwnProfile),
              SliverPersistentHeader(
                pinned: true,
                delegate: _SliverAppBarDelegate(
                  TabBar(
                    controller: _tab,
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    labelColor: AppColors.textPrimary,
                    unselectedLabelColor: AppColors.mutedForeground,
                    indicatorColor: AppColors.primary,
                    dividerColor: AppColors.border,
                    labelStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    tabs: [
                      Tab(text: l10n.get('posts')),
                      Tab(text: l10n.get('replies')),
                      Tab(text: l10n.get('media')),
                      Tab(text: l10n.get('likes')),
                    ],
                  ),
                ),
              ),
            ];
          },
          body: TabBarView(
            controller: _tab,
            children: [
              // Posts List
              _PostsList(
                postsAsync: postsAsync,
                isOwnProfile: isOwnProfile,
              ),
              // Replies — placeholder
              const _EmptyTab(
                icon: Symbols.chat_bubble,
                message: 'No replies yet',
              ),
              // Media — list filtered to posts with images
              _PostsList(
                postsAsync: postsAsync,
                mediaOnly: true,
                isOwnProfile: isOwnProfile,
                l10n: l10n,
              ),
              // Likes — placeholder
              const _EmptyTab(
                icon: Symbols.favorite,
                message: 'No liked posts yet',
              ),
            ],
          ),
        ),
      ),
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Symbols.error, size: 48, color: Colors.redAccent),
              const SizedBox(height: 16),
              Text('Error: $e'),
              TextButton(
                onPressed: () => ref.invalidate(userProfileProvider(widget.userId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final User user;
  final bool isOwnProfile;

  const _ProfileHeader({required this.user, required this.isOwnProfile});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Photo
          Container(
            height: 140,
            width: double.infinity,
            color: AppColors.muted,
            child: user.coverUrl != null
                ? CachedNetworkImage(
                    imageUrl: user.coverUrl!,
                    fit: BoxFit.cover,
                  )
                : null,
          ),

          // Profile Info Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Transform.translate(
                      offset: const Offset(0, -35),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.background,
                          shape: BoxShape.circle,
                        ),
                        child: UserAvatar(
                          uri: user.avatarUrl,
                          size: 70,
                          hasStory: user.hasStory,
                          hasUnviewedStory: user.hasUnviewedStory,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: isOwnProfile
                          ? OutlinedButton(
                              onPressed: () => context.push('/profile/edit', extra: user),
                              child: const Text('Edit profile'),
                            )
                          : Row(
                              children: [
                                IconButton(
                                  onPressed: () => context.push('/messages/start', extra: user),
                                  icon: const Icon(Symbols.mail),
                                  style: IconButton.styleFrom(
                                    side: const BorderSide(color: AppColors.border),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: () {},
                                  child: const Text('Follow'),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
                Text(
                  user.displayName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '@${user.username}',
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.mutedForeground,
                  ),
                ),
                if (user.bio != null && user.bio!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    user.bio!,
                    style: const TextStyle(fontSize: 15),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (user.website != null && user.website!.isNotEmpty) ...[
                      const Icon(Symbols.link, size: 14, color: AppColors.mutedForeground),
                      const SizedBox(width: 4),
                      Text(
                        user.website!,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 16),
                    ],
                    const Icon(Symbols.calendar_today, size: 14, color: AppColors.mutedForeground),
                    const SizedBox(width: 4),
                    Text(
                      'Joined ${user.createdAt.year}',
                      style: const TextStyle(
                        color: AppColors.mutedForeground,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _StatItem(count: user.followingCount, label: 'Following'),
                    const SizedBox(width: 20),
                    _StatItem(count: user.followersCount, label: 'Followers'),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final int count;
  final String label;

  const _StatItem({required this.count, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          '$count',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.mutedForeground,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

class _PostsList extends StatelessWidget {
  final AsyncValue<PostPage> postsAsync;
  final bool isOwnProfile;
  final bool mediaOnly;
  final L10n? l10n;

  const _PostsList({
    required this.postsAsync,
    required this.isOwnProfile,
    this.mediaOnly = false,
    this.l10n,
  });

  @override
  Widget build(BuildContext context) {
    return postsAsync.when(
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

        return ListView.builder(
          padding: EdgeInsets.zero,
          itemCount: posts.length,
          itemBuilder: (context, index) => PostCard(post: posts[index]),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
    );
  }
}

class _EmptyTab extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyTab({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 64, color: AppColors.mutedForeground.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.background,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
