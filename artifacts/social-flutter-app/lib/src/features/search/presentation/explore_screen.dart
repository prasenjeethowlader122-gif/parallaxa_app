import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/search_repository.dart';
import '../domain/search.dart';
import '../../feed/domain/post.dart';
import '../../feed/data/post_repository.dart';
import '../../../core/app_colors.dart';

final explorePostsProvider = FutureProvider<PostPage>((ref) {
  return ref.watch(postRepositoryProvider).getExplorePosts();
});

final _searchQueryProvider = StateProvider<String>((ref) => '');

final searchResultsProvider =
    FutureProvider.family<SearchResults, String>((ref, query) {
  if (query.isEmpty) {
    return Future.value(
        SearchResults(users: [], posts: [], hashtags: []));
  }
  return ref.watch(searchRepositoryProvider).search(query);
});

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    ref.read(_searchQueryProvider.notifier).state = value;
    setState(() => _isSearching = value.isNotEmpty);
  }

  void _clearSearch() {
    _searchController.clear();
    ref.read(_searchQueryProvider.notifier).state = '';
    setState(() => _isSearching = false);
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(_searchQueryProvider);

    return Column(
      children: [
        // ── Search bar ────────────────────────────────────────────────
        Container(
          decoration: const BoxDecoration(
            color: AppColors.background,
            border: Border(
              bottom: BorderSide(color: AppColors.border, width: 0.5),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: Container(
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.muted,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: _onSearchChanged,
              style: const TextStyle(
                  fontSize: 15, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search users, posts, hashtags...',
                hintStyle: const TextStyle(
                    color: AppColors.mutedForeground, fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded,
                    color: AppColors.mutedForeground, size: 20),
                suffixIcon: _isSearching
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded,
                            size: 18,
                            color: AppColors.mutedForeground),
                        onPressed: _clearSearch,
                      )
                    : null,
                border: InputBorder.none,
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ),
        // ── Body ──────────────────────────────────────────────────────
        Expanded(
          child: _isSearching
              ? _SearchResults(query: query)
              : const _ExploreGrid(),
        ),
      ],
    );
  }
}

// ─── Explore grid ─────────────────────────────────────────────────────────────

class _ExploreGrid extends ConsumerWidget {
  const _ExploreGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exploreAsync = ref.watch(explorePostsProvider);

    return exploreAsync.when(
      data: (page) => page.posts.isEmpty
          ? const Center(
              child: Text('Nothing to explore yet',
                  style: TextStyle(color: AppColors.mutedForeground)),
            )
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () =>
                  ref.refresh(explorePostsProvider.future),
              child: GridView.builder(
                padding: const EdgeInsets.all(1),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 1,
                  mainAxisSpacing: 1,
                ),
                itemCount: page.posts.length,
                itemBuilder: (context, index) {
                  final post = page.posts[index];
                  return post.imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: post.imageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              Container(color: AppColors.muted),
                          errorWidget: (_, __, ___) => Container(
                            color: AppColors.muted,
                            child: const Icon(Icons.broken_image,
                                color: AppColors.mutedForeground,
                                size: 20),
                          ),
                        )
                      : Container(
                          color: AppColors.muted,
                          alignment: Alignment.center,
                          padding: const EdgeInsets.all(6),
                          child: Text(
                            post.content ?? '',
                            style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.foreground),
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        );
                },
              ),
            ),
      loading: () => const Center(
        child: CircularProgressIndicator(
            color: AppColors.primary, strokeWidth: 2),
      ),
      error: (_, __) => const Center(
        child: Text('Could not load explore',
            style: TextStyle(color: AppColors.mutedForeground)),
      ),
    );
  }
}

// ─── Search results ───────────────────────────────────────────────────────────

class _SearchResults extends ConsumerWidget {
  final String query;

  const _SearchResults({required this.query});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultsAsync = ref.watch(searchResultsProvider(query));

    return resultsAsync.when(
      data: (results) {
        final hasResults = results.users.isNotEmpty ||
            results.posts.isNotEmpty ||
            results.hashtags.isNotEmpty;

        if (!hasResults) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.search_off_rounded,
                    size: 44, color: AppColors.mutedForeground),
                const SizedBox(height: 12),
                Text(
                  'No results for "$query"',
                  style: const TextStyle(
                    fontFamily: 'Sora',
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: AppColors.mutedForeground,
                  ),
                ),
              ],
            ),
          );
        }

        return ListView(
          children: [
            if (results.users.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 14, 16, 4),
                child: Text(
                  'People',
                  style: TextStyle(
                    fontFamily: 'Sora',
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              ...results.users.map((user) => ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    leading: CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.muted,
                      backgroundImage: user.avatarUrl != null
                          ? CachedNetworkImageProvider(
                              user.avatarUrl!)
                          : null,
                      child: user.avatarUrl == null
                          ? const Icon(Icons.person,
                              color: AppColors.mutedForeground)
                          : null,
                    ),
                    title: Row(
                      children: [
                        Text(
                          user.displayName,
                          style: const TextStyle(
                            fontFamily: 'Sora',
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (user.isVerified) ...[
                          const SizedBox(width: 3),
                          const Icon(Icons.verified,
                              size: 14, color: AppColors.verified),
                        ],
                      ],
                    ),
                    subtitle: Text(
                      '@${user.username}',
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 13),
                    ),
                    onTap: () {},
                  )),
            ],
            if (results.hashtags.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 14, 16, 4),
                child: Text(
                  'Hashtags',
                  style: TextStyle(
                    fontFamily: 'Sora',
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              ...results.hashtags.map((tag) => ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: AppColors.muted,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Text(
                        '#',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    title: Text(
                      '#${tag.name}',
                      style: const TextStyle(
                        fontFamily: 'Sora',
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      '${tag.postCount} posts',
                      style: const TextStyle(
                          color: AppColors.textMuted, fontSize: 13),
                    ),
                    onTap: () {},
                  )),
            ],
            if (results.posts.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 14, 16, 4),
                child: Text(
                  'Posts',
                  style: TextStyle(
                    fontFamily: 'Sora',
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              ...results.posts.map((post) => ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    leading: CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.muted,
                      backgroundImage: post.author.avatarUrl != null
                          ? CachedNetworkImageProvider(
                              post.author.avatarUrl!)
                          : null,
                      child: post.author.avatarUrl == null
                          ? const Icon(Icons.person,
                              color: AppColors.mutedForeground)
                          : null,
                    ),
                    title: Text(
                      post.author.displayName,
                      style: const TextStyle(
                        fontFamily: 'Sora',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      post.content ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.foreground),
                    ),
                    trailing: post.imageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: CachedNetworkImage(
                              imageUrl: post.imageUrl!,
                              width: 48,
                              height: 48,
                              fit: BoxFit.cover,
                            ),
                          )
                        : null,
                    onTap: () {},
                  )),
            ],
          ],
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(
            color: AppColors.primary, strokeWidth: 2),
      ),
      error: (_, __) => const Center(
        child: Text('Search failed',
            style: TextStyle(color: AppColors.mutedForeground)),
      ),
    );
  }
}
