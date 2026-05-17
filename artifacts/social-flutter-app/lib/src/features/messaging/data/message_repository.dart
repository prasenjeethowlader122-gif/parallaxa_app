import 'package:dio/dio.dart';
import '../domain/message.dart';

class MessageRepository {
  final Dio _dio;

  MessageRepository(this._dio);

  Future<List<Conversation>> getConversations() async {
    final response = await _dio.get('/conversations');
    return (response.data as List)
        .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<MessagePage> getMessages(String conversationId, {String? cursor, int limit = 20}) async {
    final response = await _dio.get('/conversations/$conversationId/messages', queryParameters: {
      if (cursor != null) 'cursor': cursor,
      'limit': limit,
    });
    return MessagePage.fromJson(response.data);
  }

  Future<Message> sendMessage(String conversationId, {String? content, String? mediaUrl}) async {
    final response = await _dio.post('/conversations/$conversationId/messages', data: {
      if (content != null) 'content': content,
      if (mediaUrl != null) 'mediaUrl': mediaUrl,
    });
    return Message.fromJson(response.data);
  }

  Future<Conversation> startConversation(String userId) async {
    final response = await _dio.post('/conversations/start', data: {'userId': userId});
    return Conversation.fromJson(response.data);
  }
}
