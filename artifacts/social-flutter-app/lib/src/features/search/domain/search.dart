import 'package:json_annotation/json_annotation.dart';
import '../../feed/domain/post.dart';

part 'search.g.dart';

@JsonSerializable()
class SearchResults {
  final List<UserSummary> users;
  final List<Post> posts;
  final List<Hashtag> hashtags;

  SearchResults({
    required this.users,
    required this.posts,
    required this.hashtags,
  });

  factory SearchResults.fromJson(Map<String, dynamic> json) => _$SearchResultsFromJson(json);
  Map<String, dynamic> toJson() => _$SearchResultsToJson(this);
}

@JsonSerializable()
class Hashtag {
  final String name;
  final int postCount;

  Hashtag({required this.name, required this.postCount});

  factory Hashtag.fromJson(Map<String, dynamic> json) => _$HashtagFromJson(json);
  Map<String, dynamic> toJson() => _$HashtagToJson(this);
}
