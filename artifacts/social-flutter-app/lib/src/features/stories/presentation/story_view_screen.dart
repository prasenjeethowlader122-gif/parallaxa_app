import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../data/story_repository.dart';
import '../../../core/app_colors.dart';

class StoryViewScreen extends ConsumerStatefulWidget {
  final String userId;

  const StoryViewScreen({super.key, required this.userId});

  @override
  ConsumerState<StoryViewScreen> createState() => _StoryViewScreenState();
}

class _StoryViewScreenState extends ConsumerState<StoryViewScreen> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final storiesAsync = ref.watch(userStoriesProvider(widget.userId));

    return Scaffold(
      backgroundColor: Colors.black,
      body: storiesAsync.when(
        data: (stories) {
          if (stories.isEmpty) {
            return const Center(
              child: Text(
                'No stories found',
                style: TextStyle(color: Colors.white),
              ),
            );
          }
          return Stack(
            children: [
              PageView.builder(
                controller: _pageController,
                itemCount: stories.length,
                onPageChanged: (idx) => setState(() => _currentIndex = idx),
                itemBuilder: (context, index) {
                  final story = stories[index];
                  return Center(
                    child: CachedNetworkImage(
                      imageUrl: story.mediaUrl,
                      fit: BoxFit.contain,
                      placeholder: (_, __) => const CircularProgressIndicator(),
                    ),
                  );
                },
              ),
              // Top bar with progress
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 10,
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: List.generate(stories.length, (index) {
                          return Expanded(
                            child: Container(
                              margin: const EdgeInsets.symmetric(horizontal: 2),
                              height: 3,
                              decoration: BoxDecoration(
                                color: index <= _currentIndex
                                    ? Colors.white
                                    : Colors.white.withOpacity(0.3),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Spacer(),
                          IconButton(
                            icon: const Icon(
                              CupertinoIcons.xmark,
                              color: Colors.white,
                            ),
                            onPressed: () => context.pop(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // Left/Right taps
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        if (_currentIndex > 0) {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        }
                      },
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        if (_currentIndex < stories.length - 1) {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } else {
                          context.pop();
                        }
                      },
                      child: Container(color: Colors.transparent),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: Colors.white)),
        ),
      ),
    );
  }
}
