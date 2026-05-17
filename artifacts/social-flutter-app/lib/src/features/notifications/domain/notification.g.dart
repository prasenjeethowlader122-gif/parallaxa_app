// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationItem _$NotificationItemFromJson(Map<String, dynamic> json) =>
    NotificationItem(
      id: json['id'] as String,
      type: json['type'] as String,
      fromUser: UserSummary.fromJson(json['fromUser'] as Map<String, dynamic>),
      post: json['post'] == null
          ? null
          : Post.fromJson(json['post'] as Map<String, dynamic>),
      commentContent: json['commentContent'] as String?,
      isRead: json['isRead'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$NotificationItemToJson(NotificationItem instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'fromUser': instance.fromUser,
      'post': instance.post,
      'commentContent': instance.commentContent,
      'isRead': instance.isRead,
      'createdAt': instance.createdAt.toIso8601String(),
    };

NotificationPage _$NotificationPageFromJson(Map<String, dynamic> json) =>
    NotificationPage(
      notifications: (json['notifications'] as List<dynamic>)
          .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      nextCursor: json['nextCursor'] as String?,
    );

Map<String, dynamic> _$NotificationPageToJson(NotificationPage instance) =>
    <String, dynamic>{
      'notifications': instance.notifications,
      'nextCursor': instance.nextCursor,
    };
