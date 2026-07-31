import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:social_app/src/core/storage_service.dart';

class MockFlutterSecureStorage extends Fake implements FlutterSecureStorage {
  final Map<String, String> _data = {};

  @override
  dynamic noSuchMethod(Invocation invocation) {
    final memberName = invocation.memberName;
    if (memberName == const Symbol('write')) {
      final key = invocation.namedArguments[const Symbol('key')] as String;
      final value = invocation.namedArguments[const Symbol('value')] as String?;
      if (value != null) {
        _data[key] = value;
      } else {
        _data.remove(key);
      }
      return Future<void>.value();
    } else if (memberName == const Symbol('read')) {
      final key = invocation.namedArguments[const Symbol('key')] as String;
      return Future<String?>.value(_data[key]);
    } else if (memberName == const Symbol('delete')) {
      final key = invocation.namedArguments[const Symbol('key')] as String;
      _data.remove(key);
      return Future<void>.value();
    }
    return super.noSuchMethod(invocation);
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('StorageService Tests with Mock Secure Storage', () {
    late StorageService storageService;
    late MockFlutterSecureStorage mockSecure;

    setUp(() async {
      SharedPreferences.setMockInitialValues({
        'theme_mode': 'dark',
      });
      final prefs = await SharedPreferences.getInstance();
      mockSecure = MockFlutterSecureStorage();
      storageService = StorageService(prefs, secure: mockSecure);
    });

    test('get/set Theme preference from SharedPreferences', () async {
      expect(storageService.getString('theme_mode'), 'dark');
      await storageService.setString('theme_mode', 'light');
      expect(storageService.getString('theme_mode'), 'light');
    });

    test('get/set secure Auth Token', () async {
      expect(await storageService.getAuthToken(), isNull);
      await storageService.setAuthToken('my_secure_token');
      expect(await storageService.getAuthToken(), 'my_secure_token');
    });

    test('get/set secure Current User Id', () async {
      expect(await storageService.getCurrentUserId(), isNull);
      await storageService.setCurrentUserId('user_123');
      expect(await storageService.getCurrentUserId(), 'user_123');
    });

    test('clearAuthToken deletes only auth token', () async {
      await storageService.setAuthToken('token');
      await storageService.setCurrentUserId('user');

      await storageService.clearAuthToken();
      expect(await storageService.getAuthToken(), isNull);
      expect(await storageService.getCurrentUserId(), 'user');
    });

    test('clearAll deletes all secure keys', () async {
      await storageService.setAuthToken('token');
      await storageService.setCurrentUserId('user');

      await storageService.clearAll();
      expect(await storageService.getAuthToken(), isNull);
      expect(await storageService.getCurrentUserId(), isNull);
    });
  });
}
