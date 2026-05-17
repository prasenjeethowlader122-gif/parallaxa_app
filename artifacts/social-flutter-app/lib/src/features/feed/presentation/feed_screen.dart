import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/post_repository.dart';
import '../../../core/app_colors.dart';
import 'post_card.dart';

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
        // ── Tab bar ──────────────────────────────────────────────────
        Container(
          decoration: const BoxDecoration(
            color: AppColors.background,
            border: Border(
              bottom:
                  BorderSide(color: AppColors.border, width: 0.5),
            ),
          ),
          child: TabBar(
            controller: _tab,
            tabs: _tabs.map((t) => Tab(text: t)).toList(),
            labelStyle: const TextStyle(
              fontFamily: 'Sora',
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
            unselectedLabelStyle: const TextStyle(
              fontFamily: 'Sora',
              fontWeight: FontWeight.w400,
              fontSize: 15,
            ),
            labelColor: AppColors.foreground,
            unselectedLabelColor: AppColors.mutedForeground,
            indicatorColor: AppColors.foreground,
            indicatorWeight: 3,
            indicatorSize: TabBarIndicatorSize.label,
            splashFactory: NoSplash.splashFactory,
            overlayColor:
                WidgetStateProperty.all(Colors.transparent),
          ),
        ),
        // ── Tab views ─────────────────────────────────────────────────
        Expanded(
          child: TabBarView(
            controller: _tab,
            children: [
              _FeedList(feedType: 'public'),
              _FeedList(feedType: 'following'),
              _FeedList(feedType: 'public'),
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
    final postsAsync = feedType == 'following'
        ? ref.watch(followingFeedProvider)
        : ref.watch(publicFeedProvider);

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
              const Icon(Icons.wifi_off_rounded,
                  size: 44, color: AppColors.mutedForeground),
              const SizedBox(height: 16),
              Text(
                e.toString().contains('401')
                    ? 'Please log in to continue'
                    : 'Could not load posts',
                style: const TextStyle(
                  fontFamily: 'Sora',
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
                  Icon(Icons.article_outlined,
                      size: 48,
                      color: AppColors.mutedForeground
                          .withOpacity(0.5)),
                  const SizedBox(height: 16),
                  Text(
                    feedType == 'following'
                        ? 'Follow people to see their posts here'
                        : 'Nothing here yet',
                    style: const TextStyle(
                      fontFamily: 'Sora',
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
          },
          child: ListView.builder(
            itemCount: posts.length,
            itemBuilder: (_, i) => PostCard(post: posts[i]),
          ),
        );
      },
    );
  }
}
