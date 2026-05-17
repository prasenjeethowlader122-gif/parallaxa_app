import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/search_repository.dart';
import '../domain/search.dart';
import '../../feed/domain/post.dart';
import '../../feed/data/post_repository.dart';

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

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        titleSpacing: 16,
        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            style: const TextStyle(fontSize: 15),
            decoration: InputDecoration(
              hintText: 'Search users, posts, hashtags...',
              hintStyle:
                  TextStyle(color: Colors.grey.shade500, fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
              suffixIcon: _isSearching
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      color: Colors.grey,
                      onPressed: _clearSearch,
                    )
                  : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
      ),
      body: _isSearching
          ? _SearchResults(query: query)
          : _ExploreGrid(),
    );
  }
}

class _ExploreGrid extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exploreAsync = ref.watch(explorePostsProvider);

    return exploreAsync.when(
      data: (page) => page.posts.isEmpty
          ? const Center(
              child: Text('Nothing to explore yet',
                  style: TextStyle(color: Colors.grey)))
          : RefreshIndicator(
              onRefresh: () => ref.refresh(explorePostsProvider.future),
              child: GridView.builder(
                padding: const EdgeInsets.all(2),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 2,
                  mainAxisSpacing: 2,
                ),
                itemCount: page.posts.length,
                itemBuilder: (context, index) {
                  final post = page.posts[index];
                  return Container(
                    color: Colors.grey.shade100,
                    child: post.imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: post.imageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: Colors.grey.shade200),
                            errorWidget: (_, __, ___) => const Icon(
                                Icons.broken_image,
                                color: Colors.grey),
                          )
                        : Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.all(6),
                            child: Text(
                              post.content ?? '',
                              style: const TextStyle(fontSize: 10),
                              maxLines: 4,
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                          ),
                  );
                },
              ),
            ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(
          child: Text('Could not load explore',
              style: TextStyle(color: Colors.grey))),
    );
  }
}

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
                const Icon(Icons.search_off, size: 40, color: Colors.grey),
                const SizedBox(height: 8),
                Text('No results for "$query"',
                    style: const TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }

        return ListView(
          children: [
            if (results.users.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Text('People',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
              ),
              ...results.users.map((user) => ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.grey.shade200,
                      backgroundImage: user.avatarUrl != null
                          ? CachedNetworkImageProvider(user.avatarUrl!)
                          : null,
                      child: user.avatarUrl == null
                          ? const Icon(Icons.person, color: Colors.grey)
                          : null,
                    ),
                    title: Row(
                      children: [
                        Text(user.displayName,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14)),
                        if (user.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.verified,
                              size: 14, color: Color(0xFF0095F6)),
                        ],
                      ],
                    ),
                    subtitle: Text('@${user.username}',
                        style: TextStyle(
                            color: Colors.grey.shade500, fontSize: 13)),
                    onTap: () {},
                  )),
            ],
            if (results.hashtags.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Text('Hashtags',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
              ),
              ...results.hashtags.map((tag) => ListTile(
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const Text('#',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 18)),
                    ),
                    title: Text('#${tag.name}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('${tag.postCount} posts',
                        style: TextStyle(color: Colors.grey.shade500)),
                    onTap: () {},
                  )),
            ],
            if (results.posts.isNotEmpty) ...[
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Text('Posts',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
              ),
              ...results.posts.map((post) => ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.grey.shade200,
                      backgroundImage: post.author.avatarUrl != null
                          ? CachedNetworkImageProvider(post.author.avatarUrl!)
                          : null,
                      child: post.author.avatarUrl == null
                          ? const Icon(Icons.person, color: Colors.grey)
                          : null,
                    ),
                    title: Text(post.author.displayName,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: Text(
                      post.content ?? '',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13),
                    ),
                    trailing: post.imageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(4),
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
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(
          child: Text('Search failed', style: TextStyle(color: Colors.grey))),
    );
  }
}
