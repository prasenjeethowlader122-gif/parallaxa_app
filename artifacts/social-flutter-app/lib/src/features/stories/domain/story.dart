import 'package:json_annotation/json_annotation.dart';
import '../../feed/domain/post.dart';

part 'story.g.dart';

@JsonSerializable()
class Story {
  final String id;
  final String userId;
  final String mediaUrl;
  final String mediaType; // 'image' or 'video'
  final int duration;
  final int viewsCount;
  final bool isViewed;
  final List<StoryReaction> reactions;
  final String? myReaction;
  final DateTime createdAt;
  final DateTime expiresAt;

  Story({
    required this.id,
    required this.userId,
    required this.mediaUrl,
    required this.mediaType,
    required this.duration,
    required this.viewsCount,
    required this.isViewed,
    required this.reactions,
    this.myReaction,
    required this.createdAt,
    required this.expiresAt,
  });

  factory Story.fromJson(Map<String, dynamic> json) => _$StoryFromJson(json);
  Map<String, dynamic> toJson() => _$StoryToJson(this);
}

@JsonSerializable()
class StoryReaction {
  final String emoji;
  final int count;

  StoryReaction({required this.emoji, required this.count});

  factory StoryReaction.fromJson(Map<String, dynamic> json) => _$StoryReactionFromJson(json);
  Map<String, dynamic> toJson() => _$StoryReactionToJson(this);
}

@JsonSerializable()
class StoryGroup {
  final UserSummary user;
  final List<Story> stories;
  final bool hasUnviewed;

  StoryGroup({
    required this.user,
    required this.stories,
    required this.hasUnviewed,
  });

  factory StoryGroup.fromJson(Map<String, dynamic> json) => _$StoryGroupFromJson(json);
  Map<String, dynamic> toJson() => _$StoryGroupToJson(this);
}
