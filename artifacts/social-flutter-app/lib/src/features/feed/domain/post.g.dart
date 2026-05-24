// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Post _$PostFromJson(Map<String, dynamic> json) => Post(
  id: json['id'] as String,
  author: UserSummary.fromJson(json['author'] as Map<String, dynamic>),
  parentPostId: json['parentPostId'] as String?,
  content: json['content'] as String?,
  imageUrl: json['imageUrl'] as String?,
  videoUrl: json['videoUrl'] as String?,
  location: json['location'] as String?,
  repostOf: json['repostOf'] == null
      ? null
      : Post.fromJson(json['repostOf'] as Map<String, dynamic>),
  hashtags: (json['hashtags'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  likesCount: (json['likesCount'] as num).toInt(),
  repostsCount: (json['repostsCount'] as num).toInt(),
  repliesCount: (json['repliesCount'] as num).toInt(),
  isLiked: json['isLiked'] as bool,
  isSaved: json['isSaved'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$PostToJson(Post instance) => <String, dynamic>{
  'id': instance.id,
  'author': instance.author,
  'parentPostId': instance.parentPostId,
  'content': instance.content,
  'imageUrl': instance.imageUrl,
  'videoUrl': instance.videoUrl,
  'location': instance.location,
  'repostOf': instance.repostOf,
  'hashtags': instance.hashtags,
  'likesCount': instance.likesCount,
  'repostsCount': instance.repostsCount,
  'repliesCount': instance.repliesCount,
  'isLiked': instance.isLiked,
  'isSaved': instance.isSaved,
  'createdAt': instance.createdAt.toIso8601String(),
};

UserSummary _$UserSummaryFromJson(Map<String, dynamic> json) => UserSummary(
  id: json['id'] as String,
  username: json['username'] as String,
  displayName: json['displayName'] as String,
  avatarUrl: json['avatarUrl'] as String?,
  isVerified: json['isVerified'] as bool,
  isFollowing: json['isFollowing'] as bool,
  hasStory: json['hasStory'] as bool? ?? false,
  hasUnviewedStory: json['hasUnviewedStory'] as bool? ?? false,
);

Map<String, dynamic> _$UserSummaryToJson(UserSummary instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'displayName': instance.displayName,
      'avatarUrl': instance.avatarUrl,
      'isVerified': instance.isVerified,
      'isFollowing': instance.isFollowing,
      'hasStory': instance.hasStory,
      'hasUnviewedStory': instance.hasUnviewedStory,
    };

PostPage _$PostPageFromJson(Map<String, dynamic> json) => PostPage(
  posts: (json['posts'] as List<dynamic>)
      .map((e) => Post.fromJson(e as Map<String, dynamic>))
      .toList(),
  nextCursor: json['nextCursor'] as String?,
);

Map<String, dynamic> _$PostPageToJson(PostPage instance) => <String, dynamic>{
  'posts': instance.posts,
  'nextCursor': instance.nextCursor,
};
