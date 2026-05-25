import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF0095F6);
  static const Color accent = Color(0xFFE91E8C);
  static const Color story = Color(0xFFC13584);
  static const Color destructive = Color(0xFFFF3B30);

  // Light Mode Colors (Legacy/Reference)
  static const Color background = Color(0xFFFFFFFF);
  static const Color foreground = Color(0xFF0F172A);
  static const Color card = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color muted = Color(0xFFF8FAFC);
  static const Color mutedForeground = Color(0xFF94A3B8);

  // Shared semantic colors
  static const Color like = Color(0xFFF91880);
  static const Color saved = Color(0xFF1D9BF0);
  static const Color verified = Color(0xFF1D9BF0);
  static const Color online = Color(0xFF58C322);

  // Dark Mode Palette
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color darkCard = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkMuted = Color(0xFF1E293B);
  static const Color darkMutedForeground = Color(0xFF64748B);
}
