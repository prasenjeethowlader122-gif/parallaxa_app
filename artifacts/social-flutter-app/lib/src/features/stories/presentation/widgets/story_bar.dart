import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
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
      height: 90,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
      ),
      child: storiesAsync.when(
        data: (groups) {
          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
        loading: () => const Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (e, _) => Center(
          child: IconButton(
            icon: const HugeIcon(icon: HugeIcons.strokeRoundedReload, size: 20),
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
                const UserAvatar(size: 50),
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
                    child: const HugeIcon(
                      icon: HugeIcons.strokeRoundedAdd01,
                      size: 12,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            const Text(
              'Your Story',
              style: TextStyle(fontSize: 11, color: AppColors.mutedForeground),
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
              size: 50,
              hasStory: true,
              hasUnviewedStory: group.hasUnviewed,
            ),
            const SizedBox(height: 4),
            SizedBox(
              width: 58,
              child: Text(
                group.user.displayName,
                style: const TextStyle(
                  fontSize: 11,

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
