import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../domain/story.dart';

final storyRepositoryProvider = Provider<StoryRepository>((ref) {
  return StoryRepository(ref.watch(dioProvider));
});

final userStoriesProvider = FutureProvider.family<List<Story>, String>((
  ref,
  userId,
) {
  return ref.watch(storyRepositoryProvider).getUserStories(userId);
});

class StoryRepository {
  final Dio _dio;

  StoryRepository(this._dio);

  Future<List<StoryGroup>> getStories() async {
    final response = await _dio.get('/stories');
    return (response.data as List)
        .map((e) => StoryGroup.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> viewStory(String storyId) async {
    await _dio.post('/stories/$storyId/view');
  }

  Future<void> reactToStory(String storyId, String emoji) async {
    await _dio.post('/stories/$storyId/react', data: {'emoji': emoji});
  }

  Future<String> uploadFile(String path) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(path),
    });
    final response = await _dio.post('/upload', data: formData);
    return response.data['url'] as String;
  }

  Future<List<Story>> getUserStories(String userId) async {
    final response = await _dio.get('/users/$userId/stories');
    return (response.data as List).map((e) => Story.fromJson(e)).toList();
  }

  Future<Story> createStory({
    String? mediaUrl,
    String? mediaType,
    String? content,
    String? backgroundColor,
    int? duration,
  }) async {
    final response = await _dio.post(
      '/stories',
      data: {
        if (mediaUrl != null) 'mediaUrl': mediaUrl,
        if (mediaType != null) 'mediaType': mediaType,
        if (content != null) 'content': content,
        if (backgroundColor != null) 'backgroundColor': backgroundColor,
        if (duration != null) 'duration': duration,
      },
    );
    return Story.fromJson(response.data);
  }
}
