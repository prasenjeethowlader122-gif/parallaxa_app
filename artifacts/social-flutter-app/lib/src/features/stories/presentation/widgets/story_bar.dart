import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/story_repository.dart';
import '../../domain/story.dart';
import '../../../../core/app_colors.dart';
import '../../../profile/presentation/widgets/user_avatar.dart';

class StoryBar extends ConsumerWidget {
  const StoryBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storiesAsync = ref.watch(storiesProvider);

    return Container(
      height: 110,
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(
          bottom: BorderSide(color: AppColors.border, width: 0.5),
        ),
      ),
      child: storiesAsync.when(
        data: (groups) {
          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            scrollDirection: Axis.horizontal,
            itemCount: groups.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return const _CreateStoryItem();
              }
              final group = groups[index - 1];
              return _StoryItem(group: group);
            },
          );
        },
        loading: () => const Center(child: CupertinoActivityIndicator()),
        error: (e, _) => Center(
          child: IconButton(
            icon: const Icon(CupertinoIcons.refresh, size: 20),
            onPressed: () => ref.invalidate(storiesProvider),
          ),
        ),
      ),
    );
  }
}

final storiesProvider = FutureProvider<List<StoryGroup>>((ref) {
  return ref.watch(storyRepositoryProvider).getStories();
});

class _CreateStoryItem extends StatelessWidget {
  const _CreateStoryItem();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/story/create'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          children: [
            Stack(
              children: [
                const UserAvatar(size: 64),
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.background, width: 2),
                    ),
                    padding: const EdgeInsets.all(2),
                    child: const Icon(
                      CupertinoIcons.add,
                      size: 16,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'Your Story',
              style: TextStyle(
                fontSize: 11,
                fontFamily: 'Sora',
                color: AppColors.mutedForeground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StoryItem extends StatelessWidget {
  final StoryGroup group;

  const _StoryItem({required this.group});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/stories/${group.user.id}'),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Column(
          children: [
            UserAvatar(
              uri: group.user.avatarUrl,
              size: 64,
              hasStory: true,
              hasUnviewedStory: group.hasUnviewed,
            ),
            const SizedBox(height: 6),
            SizedBox(
              width: 68,
              child: Text(
                group.user.displayName,
                style: const TextStyle(
                  fontSize: 11,
                  fontFamily: 'Sora',
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
