import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:image_picker/image_picker.dart';
import '../data/auth_repository.dart';
import '../../../core/app_colors.dart';
import '../../../core/processing_provider.dart';
import 'widgets/floating_label_input.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _pageController = PageController();
  int _currentStep = 0;

  // Step 0: Name
  final _displayNameController = TextEditingController();
  // Step 1: Birthday
  DateTime? _birthday;
  // Step 2: Contact
  final _emailController = TextEditingController();
  // Step 3: Password
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  // Step 4: Face Capture
  File? _faceImage;
  // Step 5: Username & Terms
  final _usernameController = TextEditingController();
  bool _acceptedTerms = false;

  String? _error;

  @override
  void dispose() {
    _pageController.dispose();
    _displayNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_currentStep < 5) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, preferredCameraDevice: CameraDevice.front);
    if (picked != null) {
      setState(() => _faceImage = File(picked.path));
    }
  }

  Future<void> _handleRegister() async {
    setState(() => _error = null);
    ref.read(processingProvider.notifier).show("Processing...");

    try {
      await ref.read(authRepositoryProvider).register(
        username: _usernameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        displayName: _displayNameController.text,
        dateOfBirth: _birthday ?? DateTime.now(),
        faceImagePath: _faceImage?.path,
      );
      if (mounted) context.go('/feed');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      ref.read(processingProvider.notifier).hide();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Symbols.arrow_back),
                onPressed: _prevStep,
              )
            : IconButton(
                icon: const Icon(Symbols.cancel),
                onPressed: () => context.pop(),
              ),
        title: Text('Step ${_currentStep + 1} of 6'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: (_currentStep + 1) / 6,
            backgroundColor: AppColors.muted,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (i) => setState(() => _currentStep = i),
              children: [
                _buildNameStep(),
                _buildBirthdayStep(),
                _buildContactStep(),
                _buildPasswordStep(),
                _buildFaceStep(),
                _buildUsernameStep(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNameStep() {
    return _StepLayout(
      title: "What's your name?",
      subtitle: "This is how you'll appear on Parallaxa.",
      content: FloatingLabelInput(
        label: 'Full Name',
        icon: Symbols.person,
        controller: _displayNameController,
      ),
      onNext: _displayNameController.text.isNotEmpty ? _nextStep : null,
    );
  }

  Widget _buildBirthdayStep() {
    return _StepLayout(
      title: "When's your birthday?",
      subtitle: "You must be at least 13 years old.",
      content: InkWell(
        onTap: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
            firstDate: DateTime(1900),
            lastDate: DateTime.now(),
          );
          if (picked != null) setState(() => _birthday = picked);
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.muted,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Symbols.calendar_today, color: AppColors.primary),
              const SizedBox(width: 12),
              Text(
                _birthday == null
                    ? 'Select Birthday'
                    : "${_birthday!.day}/${_birthday!.month}/${_birthday!.year}",
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
      onNext: _birthday != null ? _nextStep : null,
    );
  }

  Widget _buildContactStep() {
    return _StepLayout(
      title: "What's your email?",
      subtitle: "We'll send you a verification code.",
      content: FloatingLabelInput(
        label: 'Email',
        icon: Symbols.mail,
        controller: _emailController,
        keyboardType: TextInputType.emailAddress,
      ),
      onNext: _emailController.text.contains('@') ? _nextStep : null,
    );
  }

  Widget _buildPasswordStep() {
    return _StepLayout(
      title: "Create a password",
      subtitle: "Make sure it's at least 8 characters.",
      content: Column(
        children: [
          FloatingLabelInput(
            label: 'Password',
            icon: Symbols.lock,
            controller: _passwordController,
            isPassword: true,
          ),
          const SizedBox(height: 16),
          FloatingLabelInput(
            label: 'Confirm Password',
            icon: Symbols.lock,
            controller: _confirmPasswordController,
            isPassword: true,
          ),
        ],
      ),
      onNext: (_passwordController.text.length >= 8 &&
               _passwordController.text == _confirmPasswordController.text) ? _nextStep : null,
    );
  }

  Widget _buildFaceStep() {
    return _StepLayout(
      title: "Face Verification",
      subtitle: "Please upload a clear photo of your face for account verification.",
      content: Column(
        children: [
          if (_faceImage != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(100),
              child: Image.file(_faceImage!, width: 150, height: 150, fit: BoxFit.cover),
            )
          else
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                color: AppColors.muted,
                shape: BoxShape.circle,
              ),
              child: const Icon(Symbols.account_circle, size: 80, color: Colors.grey),
            ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton.icon(
                onPressed: () => _pickImage(ImageSource.camera),
                icon: const Icon(Symbols.photo_camera),
                label: const Text('Take Photo'),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => _pickImage(ImageSource.gallery),
                icon: const Icon(Symbols.image),
                label: const Text('Gallery'),
              ),
            ],
          ),
        ],
      ),
      onNext: _faceImage != null ? _nextStep : null,
    );
  }

  Widget _buildUsernameStep() {
    return _StepLayout(
      title: "Choose a username",
      subtitle: "You can always change this later.",
      content: Column(
        children: [
          FloatingLabelInput(
            label: 'Username',
            icon: Symbols.person,
            controller: _usernameController,
          ),
          const SizedBox(height: 24),
          CheckboxListTile(
            value: _acceptedTerms,
            onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
            title: const Text('I accept the Terms and Conditions'),
            controlAffinity: ListTileControlAffinity.leading,
          ),
        ],
      ),
      onNext: (_usernameController.text.isNotEmpty && _acceptedTerms) ? _handleRegister : null,
      nextLabel: 'Create Account',
    );
  }
}

class _StepLayout extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget content;
  final VoidCallback? onNext;
  final String nextLabel;

  const _StepLayout({
    required this.title,
    required this.subtitle,
    required this.content,
    this.onNext,
    this.nextLabel = 'Next',
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(fontSize: 16, color: AppColors.mutedForeground)),
          const SizedBox(height: 40),
          content,
          const Spacer(),
          ElevatedButton(
            onPressed: onNext,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(nextLabel, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
