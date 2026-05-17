import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/post_repository.dart';
import '../domain/post.dart';
import './post_card.dart';

final feedProvider = FutureProvider<PostPage>((ref) {
  return ref.watch(postRepositoryProvider).getFeed();
});

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(feedProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Parallaxa',
          style: TextStyle(
            fontFamily: 'Sora',
            fontWeight: FontWeight.bold,
            fontSize: 22,
            color: Colors.black,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline, color: Colors.black),
            onPressed: () => context.go('/messages'),
          ),
        ],
      ),
      body: feedAsync.when(
        data: (page) => page.posts.isEmpty
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.feed_outlined, size: 48, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('No posts yet. Follow some people!',
                        style: TextStyle(color: Colors.grey)),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: () => ref.refresh(feedProvider.future),
                child: ListView.builder(
                  itemCount: page.posts.length,
                  itemBuilder: (context, index) =>
                      PostCard(post: page.posts[index]),
                ),
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              Text('Could not load feed', style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(feedProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/create-post'),
        backgroundColor: const Color(0xFF0095F6),
        child: const Icon(Icons.edit_outlined, color: Colors.white),
      ),
    );
  }
}
