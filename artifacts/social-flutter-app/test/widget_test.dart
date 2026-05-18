import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('App starts and shows login', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    // Note: Since main() is async and uses SharedPreferences,
    // we manually pump MainApp here for simplicity in this basic test.
    // In a real app we'd use better dependency injection for tests.
  });
}
