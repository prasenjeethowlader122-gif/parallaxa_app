import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

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
    'login': 'Log In',
    'register': 'Register',
    'email': 'Email',
    'password': 'Password',
    'username': 'Username',
    'display_name': 'Full Name',
    'birthday': 'Birthday',
    'continue': 'Continue',
    'create_account': 'Create account',
    'already_have_account': 'Already have an account?',
    'sign_in': 'Sign in',
    'profile': 'Profile',
    'edit_profile': 'Edit profile',
    'followers': 'Followers',
    'following': 'Following',
    'posts': 'Posts',
    'replies': 'Replies',
    'media': 'Media',
    'likes': 'Likes',
    'message': 'Message',
    'follow': 'Follow',
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
    'login': 'লগ ইন',
    'register': 'রেজিস্টার',
    'email': 'ইমেইল',
    'password': 'পাসওয়ার্ড',
    'username': 'ব্যবহারকারীর নাম',
    'display_name': 'পুরো নাম',
    'birthday': 'জন্মদিন',
    'continue': 'চালিয়ে যান',
    'create_account': 'অ্যাকাউন্ট তৈরি করুন',
    'already_have_account': 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?',
    'sign_in': 'লগ ইন করুন',
    'profile': 'প্রোফাইল',
    'edit_profile': 'প্রোফাইল এডিট করুন',
    'followers': 'অনুসারী',
    'following': 'অনুসরণ করছেন',
    'posts': 'পোস্ট',
    'replies': 'উত্তর',
    'media': 'মিডিয়া',
    'likes': 'পছন্দ',
    'message': 'বার্তা',
    'follow': 'অনুসরণ করুন',
  };

  String get(String key) {
    if (languageCode == 'bn') return _bn[key] ?? key;
    return _en[key] ?? key;
  }
}
