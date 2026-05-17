import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../data/post_repository.dart';
import 'feed_screen.dart';

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _contentController = TextEditingController();
  File? _selectedImage;
  bool _isPosting = false;
  final _picker = ImagePicker();

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1080,
      maxHeight: 1080,
      imageQuality: 85,
    );
    if (picked != null && mounted) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _takePhoto() async {
    final picked = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1080,
      maxHeight: 1080,
      imageQuality: 85,
    );
    if (picked != null && mounted) {
      setState(() => _selectedImage = File(picked.path));
    }
  }

  Future<void> _submitPost() async {
    final content = _contentController.text.trim();
    if (content.isEmpty && _selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Write something or add a photo')),
      );
      return;
    }

    setState(() => _isPosting = true);
    try {
      final repo = ref.read(postRepositoryProvider);
      await repo.createPost(
        content: content.isNotEmpty ? content : null,
      );
      ref.invalidate(feedProvider);
      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Post published!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to post: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasContent = _contentController.text.trim().isNotEmpty || _selectedImage != null;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: TextButton(
          onPressed: _isPosting ? null : () => context.pop(),
          child: const Text('Cancel',
              style: TextStyle(color: Colors.black, fontSize: 16)),
        ),
        leadingWidth: 80,
        title: const Text(
          'New Post',
          style: TextStyle(
              fontFamily: 'Sora',
              fontWeight: FontWeight.bold,
              color: Colors.black,
              fontSize: 16),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: ElevatedButton(
              onPressed: _isPosting || !hasContent ? null : _submitPost,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0095F6),
                disabledBackgroundColor: Colors.blue.shade200,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
              ),
              child: _isPosting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Post',
                      style: TextStyle(color: Colors.white, fontSize: 14)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const Divider(height: 1),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(
                    controller: _contentController,
                    maxLines: null,
                    minLines: 5,
                    maxLength: 500,
                    autofocus: true,
                    style: const TextStyle(fontSize: 16, height: 1.5),
                    decoration: const InputDecoration(
                      hintText: "What's on your mind?",
                      hintStyle: TextStyle(color: Colors.grey, fontSize: 16),
                      border: InputBorder.none,
                      counterStyle: TextStyle(color: Colors.grey),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  if (_selectedImage != null) ...[
                    const SizedBox(height: 12),
                    Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            _selectedImage!,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: GestureDetector(
                            onTap: () => setState(() => _selectedImage = null),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Icon(Icons.close,
                                  color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.image_outlined,
                        color: Color(0xFF0095F6)),
                    onPressed: _isPosting ? null : _pickImage,
                    tooltip: 'Gallery',
                  ),
                  IconButton(
                    icon: const Icon(Icons.camera_alt_outlined,
                        color: Color(0xFF0095F6)),
                    onPressed: _isPosting ? null : _takePhoto,
                    tooltip: 'Camera',
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
