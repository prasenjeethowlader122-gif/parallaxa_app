import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_symbols_icons/material_symbols_icons.dart';
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
    final theme = Theme.of(context);

    return Column(
      children: [
        const StoryBar(),
        // ── Tab bar ──────────────────────────────────────────────────
        Container(
          decoration: BoxDecoration(color: theme.scaffoldBackgroundColor),
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
        // ── Tab views ─────────────────────────────────────────────────
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: const [
              _FeedList(feedType: 'public'),
              _FeedList(feedType: 'following'),
              _FeedList(feedType: 'trending'),
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
    return _buildList(ref, context);
  }

  Widget _buildList(WidgetRef ref, BuildContext context) {
    final theme = Theme.of(context);
    final postsAsync = switch (feedType) {
      'following' => ref.watch(followingFeedProvider),
      'trending' => ref.watch(trendingFeedProvider),
      _ => ref.watch(publicFeedProvider),
    };

    return postsAsync.when(
      loading: () => Center(
        child: CircularProgressIndicator(
          color: theme.colorScheme.primary,
          strokeWidth: 2,
        ),
      ),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                MaterialSymbols.wifi_off,
                size: 44,
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
              ),
              const SizedBox(height: 16),
              Text(
                e.toString().contains('401')
                    ? 'Please log in to continue'
                    : 'Could not load posts',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Pull down to retry',
                style: TextStyle(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
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
                  Icon(
                    MaterialSymbols.notes,
                    size: 48,
                    color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    feedType == 'following'
                        ? 'Follow people to see their posts here'
                        : 'Nothing here yet',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }
        return RefreshIndicator(
          color: theme.colorScheme.primary,
          onRefresh: () async {
            ref.invalidate(publicFeedProvider);
            ref.invalidate(followingFeedProvider);
            ref.invalidate(trendingFeedProvider);
          },
          child: ListView.builder(
            itemCount: posts.length + (posts.length / 5).floor(),
            itemBuilder: (context, i) {
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
