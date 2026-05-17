import 'package:json_annotation/json_annotation.dart';
import '../../feed/domain/post.dart';

part 'message.g.dart';

@JsonSerializable()
class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String? content;
  final String? mediaUrl;
  final bool isRead;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    this.content,
    this.mediaUrl,
    required this.isRead,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) => _$MessageFromJson(json);
  Map<String, dynamic> toJson() => _$MessageToJson(this);
}

@JsonSerializable()
class Conversation {
  final String id;
  final UserSummary participant;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.participant,
    this.lastMessage,
    required this.unreadCount,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) => _$ConversationFromJson(json);
  Map<String, dynamic> toJson() => _$ConversationToJson(this);
}

@JsonSerializable()
class MessagePage {
  final List<Message> messages;
  final String? nextCursor;

  MessagePage({
    required this.messages,
    this.nextCursor,
  });

  factory MessagePage.fromJson(Map<String, dynamic> json) => _$MessagePageFromJson(json);
  Map<String, dynamic> toJson() => _$MessagePageToJson(this);
}
