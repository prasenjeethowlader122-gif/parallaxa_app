import 'package:json_annotation/json_annotation.dart';

part 'post.g.dart';

@JsonSerializable()
class Post {
  final String id;
  final UserSummary author;
  final String? parentPostId;
  final String? content;
  final String? imageUrl;
  final String? videoUrl;
  final String? location;
  final Post? repostOf;
  final List<String> hashtags;
  final int likesCount;
  final int repostsCount;
  final int repliesCount;
  final bool isLiked;
  final bool isSaved;
  final DateTime createdAt;

  Post({
    required this.id,
    required this.author,
    this.parentPostId,
    this.content,
    this.imageUrl,
    this.videoUrl,
    this.location,
    this.repostOf,
    required this.hashtags,
    required this.likesCount,
    required this.repostsCount,
    required this.repliesCount,
    required this.isLiked,
    required this.isSaved,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);
  Map<String, dynamic> toJson() => _$PostToJson(this);
}

@JsonSerializable()
class UserSummary {
  final String id;
  final String username;
  final String displayName;
  final String? avatarUrl;
  final bool isVerified;
  final bool isFollowing;

  UserSummary({
    required this.id,
    required this.username,
    required this.displayName,
    this.avatarUrl,
    required this.isVerified,
    required this.isFollowing,
  });

  factory UserSummary.fromJson(Map<String, dynamic> json) =>
      _$UserSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$UserSummaryToJson(this);
}

@JsonSerializable()
class PostPage {
  final List<Post> posts;
  final String? nextCursor;

  PostPage({required this.posts, this.nextCursor});

  factory PostPage.fromJson(Map<String, dynamic> json) =>
      _$PostPageFromJson(json);
  Map<String, dynamic> toJson() => _$PostPageToJson(this);
}
