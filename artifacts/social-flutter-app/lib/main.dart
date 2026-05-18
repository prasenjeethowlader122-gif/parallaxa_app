import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'src/routing/app_router.dart';
import 'src/core/api_client.dart';
import 'src/core/storage_service.dart';
import 'src/core/app_colors.dart';
import 'src/core/widgets/processing_overlay.dart';
import 'src/core/ota_provider.dart';

final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      scaffoldMessengerKey: scaffoldMessengerKey,
      routerConfig: router,
      builder: (context, child) {
        return OTAUpdateListener(child: ProcessingOverlay(child: child!));
      },
      theme: ThemeData(
        fontFamily: 'Sora',
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.light,
          surface: AppColors.background,
        ),
        scaffoldBackgroundColor: AppColors.background,

        // AppBar
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.background,
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
          titleTextStyle: TextStyle(
            fontFamily: 'Sora',
            fontWeight: FontWeight.w800,
            fontSize: 20,
            color: AppColors.textPrimary,
            letterSpacing: -0.3,
          ),
          iconTheme: IconThemeData(color: AppColors.textPrimary),
        ),

        // Elevated button defaults
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: const StadiumBorder(),
            textStyle: const TextStyle(
              fontFamily: 'Sora',
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
        ),

        // Outlined button
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.textPrimary,
            side: const BorderSide(color: AppColors.border),
            shape: const StadiumBorder(),
            textStyle: const TextStyle(
              fontFamily: 'Sora',
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),

        // Text button
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            textStyle: const TextStyle(
              fontFamily: 'Sora',
              fontWeight: FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ),

        // Input decoration
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.muted,
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
          hintStyle: const TextStyle(
            color: AppColors.mutedForeground,
            fontSize: 15,
          ),
          labelStyle: const TextStyle(
            color: AppColors.mutedForeground,
            fontSize: 14,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),

        // Divider
        dividerColor: AppColors.border,
        dividerTheme: const DividerThemeData(
          color: AppColors.border,
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
        tabBarTheme: const TabBarThemeData(
          labelColor: AppColors.foreground,
          unselectedLabelColor: AppColors.mutedForeground,
          indicatorColor: AppColors.foreground,
          indicatorSize: TabBarIndicatorSize.label,
          dividerColor: Colors.transparent,
          labelStyle: TextStyle(
            fontFamily: 'Sora',
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
          unselectedLabelStyle: TextStyle(
            fontFamily: 'Sora',
            fontWeight: FontWeight.w400,
            fontSize: 15,
          ),
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
            fontFamily: 'Sora',
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
