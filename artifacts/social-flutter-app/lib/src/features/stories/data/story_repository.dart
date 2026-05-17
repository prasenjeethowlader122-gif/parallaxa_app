import 'package:dio/dio.dart';
import '../domain/story.dart';

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
}
