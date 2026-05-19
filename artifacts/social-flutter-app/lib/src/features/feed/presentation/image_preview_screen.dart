import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import '../../../core/app_colors.dart';

class ImagePreviewScreen extends StatelessWidget {
  final String imageUrl;

  const ImagePreviewScreen({super.key, required this.imageUrl});

  Future<void> _downloadImage(BuildContext context) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Processing image...')),
      );

      // 1. Download image
      final response = await http.get(Uri.parse(imageUrl));
      if (response.statusCode != 200) throw Exception('Failed to download image');

      final Uint8List bytes = response.bodyBytes;
      img.Image? image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');

      // 2. Add watermark
      final watermarkColor = img.ColorRgba8(255, 255, 255, 128);
      final font = img.arial24;

      final watermarkText =
          'Social App - ${DateFormat('yyyy-MM-dd').format(DateTime.now())}';

      // Draw shadow for better visibility
      img.drawString(
        image,
        watermarkText,
        font: font,
        x: 21,
        y: image.height - 49,
        color: img.ColorRgba8(0, 0, 0, 128),
      );

      img.drawString(
        image,
        watermarkText,
        font: font,
        x: 20,
        y: image.height - 50,
        color: watermarkColor,
      );

      // 3. Save to file
      final directory = await getTemporaryDirectory();
      final fileName = 'downloaded_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final filePath = '${directory.path}/$fileName';

      final encodedImage = img.encodeJpg(image, quality: 90);
      await File(filePath).writeAsBytes(encodedImage);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Image saved to: $filePath')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error downloading image: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.xmark, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(CupertinoIcons.cloud_download, color: Colors.white),
            onPressed: () => _downloadImage(context),
          ),
          IconButton(
            icon: const Icon(CupertinoIcons.repeat, color: Colors.white),
            onPressed: () {
              // Reuse/Repost logic
              context.pop();
              context.push('/create-post', extra: {'imageUrl': imageUrl});
            },
          ),
        ],
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.5,
          maxScale: 4.0,
          child: CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.contain,
            placeholder: (_, __) => const CircularProgressIndicator(),
            errorWidget: (_, __, ___) => const Icon(
              CupertinoIcons.exclamationmark_circle,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}
