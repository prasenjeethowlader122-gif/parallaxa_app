import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'package:intl/intl.dart';
import 'package:gal/gal.dart';
import 'package:flutter/foundation.dart';

class ImagePreviewScreen extends StatelessWidget {
  final String imageUrl;

  const ImagePreviewScreen({super.key, required this.imageUrl});

  Future<void> _downloadImage(BuildContext context) async {
    try {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Processing image...')));

      // Use compute to run image processing in a separate isolate
      final filePath = await compute(_processAndSaveImage, {
        'imageUrl': imageUrl,
        'tempDir': (await getTemporaryDirectory()).path,
      });

      // Save to gallery using gal
      await Gal.putImage(filePath);

      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Image saved to gallery')));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error downloading image: $e')));
      }
    }
  }

  static Future<String> _processAndSaveImage(Map<String, String> params) async {
    final imageUrl = params['imageUrl']!;
    final tempDir = params['tempDir']!;

    // 1. Download image
    final response = await http.get(Uri.parse(imageUrl));
    if (response.statusCode != 200) {
      throw Exception('Failed to download image');
    }

    final Uint8List bytes = response.bodyBytes;
    img.Image? image = img.decodeImage(bytes);
    if (image == null) throw Exception('Failed to decode image');

    // 2. Add watermark & metadata (EXIF)
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

    // Set some metadata in EXIF if possible via image package
    // The image package has limited EXIF support, but we can set some info
    image.exif.imageIfd.software = 'Social App';

    // 3. Save to temp file
    final fileName = 'downloaded_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final filePath = '$tempDir/$fileName';

    final encodedImage = img.encodeJpg(image, quality: 90);
    await File(filePath).writeAsBytes(encodedImage);

    return filePath;
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
            icon: const Icon(
              CupertinoIcons.cloud_download,
              color: Colors.white,
            ),
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
            placeholder: (_, _) => const CircularProgressIndicator(),
            errorWidget: (_, _, _) => const Icon(
              CupertinoIcons.exclamationmark_circle,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}
