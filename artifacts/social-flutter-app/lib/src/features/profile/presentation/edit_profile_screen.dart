import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pro_image_editor/pro_image_editor.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../data/profile_repository.dart';
import 'profile_screen.dart';
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

  String? _newAvatarUrl;
  String? _newCoverUrl;

  @override
  void initState() {
    super.initState();
    _displayNameController = TextEditingController(
      text: widget.user.displayName,
    );
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

  Future<void> _pickAndEditImage({bool isAvatar = true}) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image == null) return;

    if (!mounted) return;

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProImageEditor.file(
          File(image.path),
          callbacks: ProImageEditorCallbacks(
            onImageEditingComplete: (Uint8List bytes) async {
              setState(() {
                if (isAvatar) {
                  _newAvatarUrl = image.path;
                } else {
                  _newCoverUrl = image.path;
                }
              });
              if (context.mounted) Navigator.pop(context);
            },
          ),
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    try {
      await ref
          .read(profileRepositoryProvider)
          .updateProfile(
            displayName: _displayNameController.text,
            bio: _bioController.text,
            website: _websiteController.text,
            avatarUrl: _newAvatarUrl,
            coverUrl: _newCoverUrl,
          );
      if (mounted) {
        ref.invalidate(userProfileProvider('me'));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
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
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ── Cover Photo Edit ─────────────────────────────────────
            GestureDetector(
              onTap: () => _pickAndEditImage(isAvatar: false),
              child: Stack(
                children: [
                  Container(
                    height: 180,
                    width: double.infinity,
                    color: AppColors.muted,
                    child: _newCoverUrl != null
                        ? Image.file(File(_newCoverUrl!), fit: BoxFit.cover)
                        : (widget.user.coverUrl != null
                            ? CachedNetworkImage(
                                imageUrl: widget.user.coverUrl!,
                                fit: BoxFit.cover,
                              )
                            : const Icon(
                                Symbols.photo_camera,
                                color: AppColors.mutedForeground,
                              )),
                  ),
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withOpacity(0.4),
                      child: const Center(
                        child: Icon(
                          Symbols.photo_camera,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Avatar Edit ──────────────────────────────────────────
            Transform.translate(
              offset: const Offset(0, -50),
              child: GestureDetector(
                onTap: () => _pickAndEditImage(isAvatar: true),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.background,
                          width: 5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 60,
                        backgroundColor: AppColors.muted,
                        backgroundImage: _newAvatarUrl != null
                            ? FileImage(File(_newAvatarUrl!))
                            : (widget.user.avatarUrl != null
                                ? CachedNetworkImageProvider(
                                    widget.user.avatarUrl!,
                                  )
                                : null) as ImageProvider?,
                        child: _newAvatarUrl == null &&
                                widget.user.avatarUrl == null
                            ? const Icon(
                                Symbols.person,
                                size: 60,
                                color: AppColors.mutedForeground,
                              )
                            : null,
                      ),
                    ),
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.4),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Symbols.photo_camera,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                children: [
                  FloatingLabelInput(
                    label: 'Display Name',
                    icon: Symbols.person,
                    controller: _displayNameController,
                  ),
                  const SizedBox(height: 20),
                  FloatingLabelInput(
                    label: 'Bio',
                    icon: Symbols.chat_bubble,
                    controller: _bioController,
                    maxLines: 4,
                  ),
                  const SizedBox(height: 20),
                  FloatingLabelInput(
                    label: 'Website',
                    icon: Symbols.link,
                    controller: _websiteController,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
