import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'storage_service.dart';

final localeProvider = NotifierProvider<LocaleNotifier, Locale>(() {
  return LocaleNotifier();
});

class LocaleNotifier extends Notifier<Locale> {
  static const _key = 'locale_code';

  @override
  Locale build() {
    final storage = ref.watch(storageServiceProvider);
    final saved = storage.getString(_key);
    if (saved == 'bn') return const Locale('bn');
    return const Locale('en');
  }

  Future<void> setLocale(Locale locale) async {
    state = locale;
    final storage = ref.read(storageServiceProvider);
    await storage.setString(_key, locale.languageCode);
  }
}

final l10nProvider = Provider<L10n>((ref) {
  final locale = ref.watch(localeProvider);
  return L10n(locale.languageCode);
});

class L10n {
  final String languageCode;
  L10n(this.languageCode);

  static const _en = {
    'feed': 'Feed',
    'settings': 'Settings',
    'post': 'Post',
    'reposted': 'reposted',
    'logout': 'Log out',
    'language': 'Language',
    'dark_mode': 'Dark Mode',
    'account': 'Account',
    'security': 'Security & Privacy',
    'support': 'Support & About',
    'chat_settings': 'Chat Settings',
    'mute': 'Mute Notifications',
    'block': 'Block User',
    'delete_chat': 'Delete Chat',
  };

  static const _bn = {
    'feed': 'ফিড',
    'settings': 'সেটিংস',
    'post': 'পোস্ট',
    'reposted': 'পুনরায় পোস্ট করা হয়েছে',
    'logout': 'লগ আউট',
    'language': 'ভাষা',
    'dark_mode': 'ডার্ক মোড',
    'account': 'অ্যাকাউন্ট',
    'security': 'নিরাপত্তা ও গোপনীয়তা',
    'support': 'সহায়তা ও তথ্য',
    'chat_settings': 'চ্যাট সেটিংস',
    'mute': 'মিউট নোটিফিকেশন',
    'block': 'ব্লক করুন',
    'delete_chat': 'চ্যাট ডিলিট করুন',
  };

  String get(String key) {
    if (languageCode == 'bn') return _bn[key] ?? key;
    return _en[key] ?? key;
  }
}
