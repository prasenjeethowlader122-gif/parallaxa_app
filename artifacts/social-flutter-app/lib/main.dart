import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'src/routing/app_router.dart';
import 'src/core/api_client.dart';
import 'src/core/storage_service.dart';
import 'src/core/app_colors.dart';
import 'src/core/widgets/processing_overlay.dart';
import 'src/core/ota_provider.dart';
import 'src/core/theme_provider.dart';
import 'src/core/localization_provider.dart';

final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MobileAds.instance.initialize();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        storageServiceProvider.overrideWithValue(StorageService(prefs)),
      ],
      child: const MainApp(),
    ),
  );
}

class MainApp extends ConsumerWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: scaffoldMessengerKey,
      routerConfig: router,
      themeMode: themeMode,
      locale: locale,
      builder: (context, child) {
        return OTAUpdateListener(child: ProcessingOverlay(child: child!));
      },
      theme: _buildTheme(Brightness.light),
      darkTheme: _buildTheme(Brightness.dark),
    );
  }

  ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final baseColor = isDark ? Colors.white : AppColors.textPrimary;
    final bgColor = isDark ? const Color(0xFF0F172A) : AppColors.background;
    final cardColor = isDark ? const Color(0xFF1E293B) : AppColors.card;
    final borderColor = isDark ? const Color(0xFF334155) : AppColors.border;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: brightness,
        surface: bgColor,
      ),
      scaffoldBackgroundColor: bgColor,
      textTheme: GoogleFonts.ubuntuTextTheme().apply(
        bodyColor: baseColor,
        displayColor: baseColor,
      ),

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: bgColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: GoogleFonts.ubuntu(
          fontWeight: FontWeight.w700,
          fontSize: 20,
          color: baseColor,
        ),
        iconTheme: IconThemeData(color: baseColor),
      ),

      // Elevated button defaults
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: const StadiumBorder(),
          textStyle: GoogleFonts.ubuntu(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),

      // Outlined button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: baseColor,
          side: BorderSide(color: borderColor),
          shape: const StadiumBorder(),
          textStyle: GoogleFonts.ubuntu(
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ),

      // Text button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: GoogleFonts.ubuntu(
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),

      // Input decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF1E293B) : AppColors.muted,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        hintStyle: TextStyle(
          color: isDark ? Colors.grey : AppColors.mutedForeground,
          fontSize: 15,
        ),
        labelStyle: TextStyle(
          color: isDark ? Colors.grey : AppColors.mutedForeground,
          fontSize: 14,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),

      // Divider
      dividerColor: borderColor,
      dividerTheme: DividerThemeData(
        color: borderColor,
        thickness: 0.5,
        space: 0.5,
      ),

      // FAB
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 6,
        shape: CircleBorder(),
      ),

      // Tabs
      tabBarTheme: TabBarThemeData(
        labelColor: baseColor,
        unselectedLabelColor: isDark ? Colors.grey : AppColors.mutedForeground,
        indicatorColor: baseColor,
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
        labelStyle: GoogleFonts.ubuntu(
          fontWeight: FontWeight.w700,
          fontSize: 15,
        ),
        unselectedLabelStyle: GoogleFonts.ubuntu(
          fontWeight: FontWeight.w400,
          fontSize: 15,
        ),
      ),
    );
  }
}

class OTAUpdateListener extends ConsumerStatefulWidget {
  final Widget child;
  const OTAUpdateListener({super.key, required this.child});

  @override
  ConsumerState<OTAUpdateListener> createState() => _OTAUpdateListenerState();
}

class _OTAUpdateListenerState extends ConsumerState<OTAUpdateListener> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(otaProvider.notifier).checkForUpdate();
    });
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(otaProvider, (previous, next) {
      if (next.status == OTAStatus.downloading) {
        _showSnackBar(next.message ?? "Downloading update...");
      } else if (next.status == OTAStatus.downloaded) {
        _showSnackBar(
          next.message ?? "Update ready. Please restart the app.",
          isPersistent: true,
        );
      }
    });
    return widget.child;
  }

  void _showSnackBar(String message, {bool isPersistent = false}) {
    scaffoldMessengerKey.currentState?.hideCurrentSnackBar();
    scaffoldMessengerKey.currentState?.showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(

            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        duration: isPersistent
            ? const Duration(days: 1)
            : const Duration(seconds: 4),
        action: isPersistent
            ? SnackBarAction(
                label: 'Dismiss',
                textColor: Colors.white,
                onPressed: () {
                  scaffoldMessengerKey.currentState?.hideCurrentSnackBar();
                },
              )
            : null,
      ),
    );
  }
}
