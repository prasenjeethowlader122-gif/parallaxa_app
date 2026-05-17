// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SearchResults _$SearchResultsFromJson(Map<String, dynamic> json) =>
    SearchResults(
      users: (json['users'] as List<dynamic>)
          .map((e) => UserSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
      posts: (json['posts'] as List<dynamic>)
          .map((e) => Post.fromJson(e as Map<String, dynamic>))
          .toList(),
      hashtags: (json['hashtags'] as List<dynamic>)
          .map((e) => Hashtag.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SearchResultsToJson(SearchResults instance) =>
    <String, dynamic>{
      'users': instance.users,
      'posts': instance.posts,
      'hashtags': instance.hashtags,
    };

Hashtag _$HashtagFromJson(Map<String, dynamic> json) => Hashtag(
  name: json['name'] as String,
  postCount: (json['postCount'] as num).toInt(),
);

Map<String, dynamic> _$HashtagToJson(Hashtag instance) => <String, dynamic>{
  'name': instance.name,
  'postCount': instance.postCount,
};
