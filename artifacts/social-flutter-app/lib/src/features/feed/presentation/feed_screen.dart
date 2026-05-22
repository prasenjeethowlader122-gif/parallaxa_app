import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import '../data/post_repository.dart';
import '../../../core/app_colors.dart';
import 'post_card.dart';
import '../../stories/presentation/widgets/story_bar.dart';
import '../../../core/widgets/ad_banner_widget.dart';

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  static const _tabs = ['For You', 'Following', 'Trending'];

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const StoryBar(),
        // ── Tab bar ──────────────────────────────────────────────────
        Container(
          decoration: const BoxDecoration(color: AppColors.background),
          child: TabBar(
            controller: _tab,
            tabs: _tabs.map((t) => Tab(text: t)).toList(),
            labelStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w400,
              fontSize: 15,
            ),
            labelColor: AppColors.foreground,
            unselectedLabelColor: AppColors.mutedForeground,
            indicatorColor: AppColors.foreground,
            indicatorWeight: 3,
            indicatorSize: TabBarIndicatorSize.label,
            splashFactory: NoSplash.splashFactory,
            overlayColor: WidgetStateProperty.all(Colors.transparent),
          ),
        ),
        // ── Tab views ─────────────────────────────────────────────────
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: [
              const _FeedList(feedType: 'public'),
              const _FeedList(feedType: 'following'),
              const _FeedList(feedType: 'trending'),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _FeedList extends ConsumerWidget {
  final String feedType;

  const _FeedList({required this.feedType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _buildList(ref);
  }

  Widget _buildList(WidgetRef ref) {
    final postsAsync = switch (feedType) {
      'following' => ref.watch(followingFeedProvider),
      'trending' => ref.watch(trendingFeedProvider),
      _ => ref.watch(publicFeedProvider),
    };

    return postsAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
          strokeWidth: 2,
        ),
      ),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const HugeIcon(
                icon: HugeIcons.strokeRoundedWifi01,
                size: 44,
                color: AppColors.mutedForeground,
              ),
              const SizedBox(height: 16),
              Text(
                e.toString().contains('401')
                    ? 'Please log in to continue'
                    : 'Could not load posts',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.foreground,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Pull down to retry',
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.mutedForeground,
                ),
              ),
            ],
          ),
        ),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  HugeIcon(
                    icon: HugeIcons.strokeRoundedNote01,
                    size: 48,
                    color: AppColors.mutedForeground.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    feedType == 'following'
                        ? 'Follow people to see their posts here'
                        : 'Nothing here yet',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.foreground,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(publicFeedProvider);
            ref.invalidate(followingFeedProvider);
            ref.invalidate(trendingFeedProvider);
          },
          child: ListView.builder(
            itemCount: posts.length + (posts.length / 5).floor(),
            itemBuilder: (_, i) {
              if (i > 0 && (i + 1) % 6 == 0) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: AdBannerWidget(),
                );
              }
              final postIndex = i - (i / 6).floor();
              if (postIndex >= posts.length) return const SizedBox.shrink();
              return PostCard(post: posts[postIndex]);
            },
          ),
        );
      },
    );
  }
}
