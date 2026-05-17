import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/search_repository.dart';
import '../domain/search.dart';
import '../../feed/domain/post.dart';
import '../../../core/api_client.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepository(ref.watch(dioProvider));
});

final explorePostsProvider = FutureProvider<PostPage>((ref) {
  return ref.watch(searchRepositoryProvider).getExplorePosts();
});

class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exploreAsync = ref.watch(explorePostsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore', style: TextStyle(fontFamily: 'Sora', fontWeight: FontWeight.bold)),
      ),
      body: exploreAsync.when(
        data: (page) => GridView.builder(
          padding: const EdgeInsets.all(2),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 2,
            mainAxisSpacing: 2,
          ),
          itemCount: page.posts.length,
          itemBuilder: (context, index) {
            final post = page.posts[index];
            return Container(
              color: Colors.grey.shade200,
              child: post.imageUrl != null
                  ? Image.network(post.imageUrl!, fit: BoxFit.cover)
                  : const Center(child: Icon(Icons.text_fields)),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
