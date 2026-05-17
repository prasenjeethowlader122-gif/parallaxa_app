import 'package:json_annotation/json_annotation.dart';
import '../../feed/domain/post.dart';

part 'notification.g.dart';

@JsonSerializable()
class NotificationItem {
  final String id;
  final String type; // 'like', 'comment', 'follow', 'mention', 'reply'
  final UserSummary fromUser;
  final Post? post;
  final String? commentContent;
  final bool isRead;
  final DateTime createdAt;

  NotificationItem({
    required this.id,
    required this.type,
    required this.fromUser,
    this.post,
    this.commentContent,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) => _$NotificationItemFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationItemToJson(this);
}

@JsonSerializable()
class NotificationPage {
  final List<NotificationItem> notifications;
  final String? nextCursor;

  NotificationPage({
    required this.notifications,
    this.nextCursor,
  });

  factory NotificationPage.fromJson(Map<String, dynamic> json) => _$NotificationPageFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationPageToJson(this);
}
