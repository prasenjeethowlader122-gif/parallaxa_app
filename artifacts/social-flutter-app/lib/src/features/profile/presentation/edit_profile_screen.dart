import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/profile_repository.dart';
import '../../auth/domain/user.dart';
import '../../../core/app_colors.dart';
import '../../auth/presentation/widgets/floating_label_input.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  final User user;
  const EditProfileScreen({super.key, required this.user});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _displayNameController;
  late final TextEditingController _bioController;
  late final TextEditingController _websiteController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _displayNameController = TextEditingController(text: widget.user.displayName);
    _bioController = TextEditingController(text: widget.user.bio);
    _websiteController = TextEditingController(text: widget.user.website);
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _bioController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    try {
      await ref.read(profileRepositoryProvider).updateProfile(
        displayName: _displayNameController.text,
        bio: _bioController.text,
        website: _websiteController.text,
      );
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Edit Profile'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveProfile,
            child: _isSaving
              ? const CupertinoActivityIndicator()
              : const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            FloatingLabelInput(
              label: 'Display Name',
              icon: CupertinoIcons.person,
              controller: _displayNameController,
            ),
            const SizedBox(height: 16),
            FloatingLabelInput(
              label: 'Bio',
              icon: CupertinoIcons.text_bubble,
              controller: _bioController,
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            FloatingLabelInput(
              label: 'Website',
              icon: CupertinoIcons.link,
              controller: _websiteController,
            ),
          ],
        ),
      ),
    );
  }
}
