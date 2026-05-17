import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static const _authTokenKey = 'auth_token';
  static const _currentUserIdKey = 'current_user_id';

  Future<void> setAuthToken(String token) async {
    await _prefs.setString(_authTokenKey, token);
  }

  String? getAuthToken() {
    return _prefs.getString(_authTokenKey);
  }

  Future<void> clearAuthToken() async {
    await _prefs.remove(_authTokenKey);
  }

  Future<void> setCurrentUserId(String userId) async {
    await _prefs.setString(_currentUserIdKey, userId);
  }

  String? getCurrentUserId() {
    return _prefs.getString(_currentUserIdKey);
  }

  Future<void> clearAll() async {
    await _prefs.remove(_authTokenKey);
    await _prefs.remove(_currentUserIdKey);
  }
}
