// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'story.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Story _$StoryFromJson(Map<String, dynamic> json) => Story(
  id: json['id'] as String,
  userId: json['userId'] as String,
  mediaUrl: json['mediaUrl'] as String,
  mediaType: json['mediaType'] as String,
  duration: (json['duration'] as num).toInt(),
  viewsCount: (json['viewsCount'] as num).toInt(),
  isViewed: json['isViewed'] as bool,
  reactions: (json['reactions'] as List<dynamic>)
      .map((e) => StoryReaction.fromJson(e as Map<String, dynamic>))
      .toList(),
  myReaction: json['myReaction'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  expiresAt: DateTime.parse(json['expiresAt'] as String),
);

Map<String, dynamic> _$StoryToJson(Story instance) => <String, dynamic>{
  'id': instance.id,
  'userId': instance.userId,
  'mediaUrl': instance.mediaUrl,
  'mediaType': instance.mediaType,
  'duration': instance.duration,
  'viewsCount': instance.viewsCount,
  'isViewed': instance.isViewed,
  'reactions': instance.reactions,
  'myReaction': instance.myReaction,
  'createdAt': instance.createdAt.toIso8601String(),
  'expiresAt': instance.expiresAt.toIso8601String(),
};

StoryReaction _$StoryReactionFromJson(Map<String, dynamic> json) =>
    StoryReaction(
      emoji: json['emoji'] as String,
      count: (json['count'] as num).toInt(),
    );

Map<String, dynamic> _$StoryReactionToJson(StoryReaction instance) =>
    <String, dynamic>{'emoji': instance.emoji, 'count': instance.count};

StoryGroup _$StoryGroupFromJson(Map<String, dynamic> json) => StoryGroup(
  user: UserSummary.fromJson(json['user'] as Map<String, dynamic>),
  stories: (json['stories'] as List<dynamic>)
      .map((e) => Story.fromJson(e as Map<String, dynamic>))
      .toList(),
  hasUnviewed: json['hasUnviewed'] as bool,
);

Map<String, dynamic> _$StoryGroupToJson(StoryGroup instance) =>
    <String, dynamic>{
      'user': instance.user,
      'stories': instance.stories,
      'hasUnviewed': instance.hasUnviewed,
    };
