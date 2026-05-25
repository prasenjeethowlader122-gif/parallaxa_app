import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String username;
  final String email;
  final String displayName;
  final String? bio;
  final String? avatarUrl;
  final String? website;
  final bool isVerified;
  final String? verificationStatus;
  final String? role;
  final bool? isFrozen;
  final bool? twoFactorEnabled;
  final bool? isPrivate;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final DateTime? dateOfBirth;
  final DateTime createdAt;
  final bool hasStory;
  final bool hasUnviewedStory;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.displayName,
    this.bio,
    this.avatarUrl,
    this.website,
    required this.isVerified,
    this.verificationStatus,
    this.role,
    this.isFrozen = false,
    this.twoFactorEnabled = false,
    this.isPrivate = false,
    required this.followersCount,
    required this.followingCount,
    required this.postsCount,
    this.dateOfBirth,
    required this.createdAt,
    this.hasStory = false,
    this.hasUnviewedStory = false,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class AuthResponse {
  final String? token;
  final User? user;
  final bool twoFactorRequired;

  AuthResponse({this.token, this.user, required this.twoFactorRequired});

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
