import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import "package:material_symbols_icons/material_symbols_icons.dart";
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import '../data/story_repository.dart';

class StoryCreateScreen extends ConsumerStatefulWidget {
  const StoryCreateScreen({super.key});

  @override
  ConsumerState<StoryCreateScreen> createState() => _StoryCreateScreenState();
}

class _StoryCreateScreenState extends ConsumerState<StoryCreateScreen> {
  File? _image;
  final _picker = ImagePicker();
  bool _isUploading = false;

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _image = File(pickedFile.path));
    }
  }

  Future<void> _uploadStory() async {
    if (_image == null) return;

    setState(() => _isUploading = true);
    try {
      final repo = ref.read(storyRepositoryProvider);
      final url = await repo.uploadFile(_image!.path);

      await repo.createStory(mediaUrl: url, mediaType: 'image');
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Add to Story',
          style: TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(
            Symbols.cancel,
            color: Colors.white,
          ),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (_image != null)
            TextButton(
              onPressed: _isUploading ? null : _uploadStory,
              child: _isUploading
                  ? const CupertinoActivityIndicator(color: Colors.white)
                  : const Text(
                      'Share',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
        ],
      ),
      body: Center(
        child: _image == null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Symbols.photo_camera,
                    color: Colors.white,
                    size: 64,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _pickImage,
                    child: const Text('Select from Gallery'),
                  ),
                ],
              )
            : Image.file(_image!),
      ),
    );
  }
}
