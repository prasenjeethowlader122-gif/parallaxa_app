import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;

  StorageService(this._prefs, {FlutterSecureStorage secure = const FlutterSecureStorage()})
      : _secure = secure;

  static const _authTokenKey = 'auth_token';
  static const _currentUserIdKey = 'current_user_id';

  Future<void> setAuthToken(String token) async {
    await _secure.write(key: _authTokenKey, value: token);
  }

  Future<String?> getAuthToken() async {
    return await _secure.read(key: _authTokenKey);
  }

  Future<void> clearAuthToken() async {
    await _secure.delete(key: _authTokenKey);
  }

  Future<void> setCurrentUserId(String userId) async {
    await _secure.write(key: _currentUserIdKey, value: userId);
  }

  Future<String?> getCurrentUserId() async {
    return await _secure.read(key: _currentUserIdKey);
  }

  Future<void> clearAll() async {
    await _secure.delete(key: _authTokenKey);
    await _secure.delete(key: _currentUserIdKey);
  }

  Future<void> setString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    return _prefs.getString(key);
  }
}
