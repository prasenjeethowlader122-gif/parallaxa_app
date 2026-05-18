// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: json['id'] as String,
  username: json['username'] as String,
  email: json['email'] as String,
  displayName: json['displayName'] as String,
  bio: json['bio'] as String?,
  avatarUrl: json['avatarUrl'] as String?,
  website: json['website'] as String?,
  isVerified: json['isVerified'] as bool,
  verificationStatus: json['verificationStatus'] as String?,
  role: json['role'] as String?,
  isFrozen: json['isFrozen'] as bool? ?? false,
  twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
  isPrivate: json['isPrivate'] as bool? ?? false,
  followersCount: (json['followersCount'] as num).toInt(),
  followingCount: (json['followingCount'] as num).toInt(),
  postsCount: (json['postsCount'] as num).toInt(),
  dateOfBirth: json['dateOfBirth'] == null
      ? null
      : DateTime.parse(json['dateOfBirth'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  'id': instance.id,
  'username': instance.username,
  'email': instance.email,
  'displayName': instance.displayName,
  'bio': instance.bio,
  'avatarUrl': instance.avatarUrl,
  'website': instance.website,
  'isVerified': instance.isVerified,
  'verificationStatus': instance.verificationStatus,
  'role': instance.role,
  'isFrozen': instance.isFrozen,
  'twoFactorEnabled': instance.twoFactorEnabled,
  'isPrivate': instance.isPrivate,
  'followersCount': instance.followersCount,
  'followingCount': instance.followingCount,
  'postsCount': instance.postsCount,
  'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
  'createdAt': instance.createdAt.toIso8601String(),
};

AuthResponse _$AuthResponseFromJson(Map<String, dynamic> json) => AuthResponse(
  token: json['token'] as String?,
  user: json['user'] == null
      ? null
      : User.fromJson(json['user'] as Map<String, dynamic>),
  twoFactorRequired: json['twoFactorRequired'] as bool,
);

Map<String, dynamic> _$AuthResponseToJson(AuthResponse instance) =>
    <String, dynamic>{
      'token': instance.token,
      'user': instance.user,
      'twoFactorRequired': instance.twoFactorRequired,
    };
