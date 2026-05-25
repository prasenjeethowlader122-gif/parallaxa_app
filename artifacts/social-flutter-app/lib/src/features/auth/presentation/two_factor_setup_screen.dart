import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import '../data/auth_repository.dart';
import '../../../core/app_colors.dart';

class TwoFactorSetupScreen extends ConsumerStatefulWidget {
  const TwoFactorSetupScreen({super.key});

  @override
  ConsumerState<TwoFactorSetupScreen> createState() =>
      _TwoFactorSetupScreenState();
}

class _TwoFactorSetupScreenState extends ConsumerState<TwoFactorSetupScreen> {
  final _codeController = TextEditingController();
  bool _isLoading = false;
  Map<String, dynamic>? _setupData;

  @override
  void initState() {
    super.initState();
    _startSetup();
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _startSetup() async {
    setState(() => _isLoading = true);
    try {
      // Mocking setup data
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _setupData = {
          'secret': 'JBSWY3DPEHPK3PXP',
          'qrCodeUri': 'https://via.placeholder.com/200',
        };
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _enable2FA() async {
    if (_codeController.text.length != 6) return;
    setState(() => _isLoading = true);
    try {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('2FA Enabled Successfully')),
        );
        context.pop();
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Two-Factor Authentication'),
        leading: IconButton(
          icon: const Icon(
            Symbols.arrow_back,
            color: AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: _isLoading && _setupData == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '1. Scan this QR code with an authenticator app (like Google Authenticator or Authy).',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 24),
                  if (_setupData != null) ...[
                    Center(
                      child: Column(
                        children: [
                          Image.network(
                            _setupData!['qrCodeUri'],
                            width: 200,
                            height: 200,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _setupData!['secret'],
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              color: AppColors.mutedForeground,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                  const Text(
                    '2. Enter the 6-digit code from the app to verify.',
                    style: TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _codeController,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 10,
                    ),
                    decoration: const InputDecoration(hintText: '000000'),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _codeController.text.length == 6
                        ? _enable2FA
                        : null,
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 56),
                    ),
                    child: _isLoading
                        ? const CupertinoActivityIndicator(color: Colors.white)
                        : const Text('Enable 2FA'),
                  ),
                ],
              ),
            ),
    );
  }
}
