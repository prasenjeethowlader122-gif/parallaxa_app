import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/feed/data/post_repository.dart';
import '../features/feed/domain/post.dart';
import '../features/feed/presentation/post_card.dart';
import '../core/api_client.dart';

final postRepositoryProvider = Provider<PostRepository>((ref) {
  return PostRepository(ref.watch(dioProvider));
});

final feedProvider = FutureProvider<PostPage>((ref) {
  return ref.watch(postRepositoryProvider).getFeed();
});

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(feedProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Parallaxa', style: TextStyle(fontFamily: 'Sora', fontWeight: FontWeight.bold)),
      ),
      body: feedAsync.when(
        data: (page) => ListView.builder(
          itemCount: page.posts.length,
          itemBuilder: (context, index) => PostCard(post: page.posts[index]),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err')),
      ),
    );
  }
}
