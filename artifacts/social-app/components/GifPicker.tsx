import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';

const CURATED_GIFS = [
  { id: '1', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKURv607I8QG2S4/giphy.gif', title: 'Laugh' },
  { id: '2', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0MYzLL799mmwevVC/giphy.gif', title: 'Cool' },
  { id: '3', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif', title: 'Happy' },
  { id: '4', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/26gsjCZpPolPr3sBy/giphy.gif', title: 'Wow' },
  { id: '5', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKSjP306pD0D9e0/giphy.gif', title: 'Wave' },
  { id: '6', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l41lTfORV2vCY96Ny/giphy.gif', title: 'Dance' },
  { id: '7', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKD5l97XpZ8T64U/giphy.gif', title: 'Thumbs Up' },
  { id: '8', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ6NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4NXN4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlIDZ4H5Hl44KTC/giphy.gif', title: 'Celebrate' },
];

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const GifPicker = ({ visible, onClose, onSelect }: GifPickerProps) => {
  const colors = useColors();
  const [search, setSearch] = useState('');

  const filteredGifs = CURATED_GIFS.filter(gif =>
    gif.title.toLowerCase().includes(search.toLowerCase())
  );

  const windowHeight = Dimensions.get('window').height;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.content, {
          backgroundColor: colors.background,
          height: windowHeight * 0.7,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Send a GIF</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <HugeiconsIcon icon={Cancel01Icon} size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.muted }]}>
            <HugeiconsIcon icon={Search01Icon} size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search GIFs..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Grid */}
          <FlatList
            data={filteredGifs}
            numColumns={2}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gifItem}
                onPress={() => {
                  onSelect(item.url);
                  onClose();
                }}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.gifImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: '100%',
  },
  listContainer: {
    padding: 8,
  },
  gifItem: {
    flex: 0.5,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
});
