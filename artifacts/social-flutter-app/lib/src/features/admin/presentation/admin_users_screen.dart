import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hugeicons/hugeicons.dart';
import '../data/admin_repository.dart';
import '../../../core/app_colors.dart';
import '../../auth/domain/user.dart';

class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _toggleVerify(User user) async {
    try {
      await ref.read(adminRepositoryProvider).verifyUser(user.id);
      ref.invalidate(adminUsersProvider);
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(adminUsersProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('User Management'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.muted,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: 'Search users...',
                  prefixIcon: Padding(
                    padding: EdgeInsets.all(10),
                    child: HugeIcon(
                      icon: HugeIcons.strokeRoundedSearch01,
                      color: AppColors.mutedForeground,
                      size: 20,
                    ),
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 10),
                ),
              ),
            ),
          ),
        ),
      ),
      body: usersAsync.when(
        data: (users) => RefreshIndicator(
          onRefresh: () => ref.refresh(adminUsersProvider.future),
          child: ListView.separated(
            itemCount: users.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final user = users[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundImage: user.avatarUrl != null
                      ? NetworkImage(user.avatarUrl!)
                      : null,
                  child: user.avatarUrl == null
                      ? const HugeIcon(
                          icon: HugeIcons.strokeRoundedUser,
                          color: AppColors.mutedForeground,
                        )
                      : null,
                ),
                title: Text(
                  user.displayName,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text('@${user.username}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (user.isVerified)
                      const HugeIcon(
                        icon: HugeIcons.strokeRoundedCheckmarkBadge01,
                        color: AppColors.verified,
                        size: 20,
                      )
                    else
                      IconButton(
                        icon: const HugeIcon(
                          icon: HugeIcons.strokeRoundedCheckmarkBadge01,
                          size: 20,
                        ),
                        onPressed: () => _toggleVerify(user),
                      ),
                    PopupMenuButton(
                      icon: const HugeIcon(
                        icon: HugeIcons.strokeRoundedMoreVertical,
                        size: 20,
                        color: AppColors.textPrimary,
                      ),
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          child: Text(
                            user.isFrozen == true ? 'Unfreeze' : 'Freeze',
                          ),
                          onTap: () {
                            // Logic
                          },
                        ),
                        const PopupMenuItem(
                          child: Text(
                            'Delete User',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
