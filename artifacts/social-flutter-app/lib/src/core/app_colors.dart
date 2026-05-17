import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF0095F6);
  static const Color accent = Color(0xFFE91E8C);
  static const Color story = Color(0xFFC13584);
  static const Color destructive = Color(0xFFFF3B30);

  static const Color background = Color(0xFFFFFFFF);
  static const Color foreground = Color(0xFF0F172A); // Slate-900
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textMuted = Color(0xFF64748B); // Slate-500

  static const Color card = Color(0xFFFFFFFF);
  static const Color secondary = Color(0xFFF1F5F9); // Slate-100
  static const Color muted = Color(0xFFF8FAFC); // Slate-50
  static const Color mutedForeground = Color(0xFF94A3B8); // Slate-400
  static const Color border = Color(0xFFE2E8F0); // Slate-200

  static const Color like = Color(0xFFF91880);
  static const Color saved = Color(0xFF1D9BF0);
  static const Color verified = Color(0xFF1D9BF0);
  static const Color online = Color(0xFF58C322);

  static const double radius = 16;

  // Slate palette for more specific usage
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate300 = Color(0xFFCBD5E1);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate600 = Color(0xFF475569);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);

  /// primary at ~7% opacity for unread notification row
  static const Color unreadBg = Color(0x120095F6);
}
