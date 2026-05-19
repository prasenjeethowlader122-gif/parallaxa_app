import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../data/admin_repository.dart';
import '../../../core/app_colors.dart';

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(adminStatsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.arrow_left),
          onPressed: () => context.pop(),
        ),
      ),
      body: statsAsync.when(
        data: (stats) => RefreshIndicator(
          onRefresh: () => ref.refresh(adminStatsProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _StatCard(
                title: 'Total Users',
                value: stats.totalUsers.toString(),
                icon: CupertinoIcons.person_2_fill,
                color: Colors.blue,
              ),
              const SizedBox(height: 16),
              _StatCard(
                title: 'Total Posts',
                value: stats.totalPosts.toString(),
                icon: CupertinoIcons.doc_text_fill,
                color: Colors.green,
              ),
              const SizedBox(height: 16),
              _StatCard(
                title: 'Total Stories',
                value: stats.totalStories.toString(),
                icon: CupertinoIcons.play_circle_fill,
                color: Colors.orange,
              ),
              const SizedBox(height: 24),
              const Text(
                'Management',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Sora',
                ),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(
                  CupertinoIcons.person_crop_circle_badge_checkmark,
                ),
                title: const Text('User Management'),
                subtitle: const Text('Verify, freeze, or delete users'),
                trailing: const Icon(CupertinoIcons.chevron_right),
                onTap: () => context.push('/admin/users'),
                tileColor: AppColors.muted,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.muted,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(width: 20),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.mutedForeground,
                  fontFamily: 'Sora',
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Sora',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
