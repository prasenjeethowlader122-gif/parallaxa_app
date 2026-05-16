import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { useCreateStory } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon, Image01Icon, Video01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const ITEM_SIZE = (width - 3) / NUM_COLUMNS; // 1px gap between columns

export default function CreateStoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [overlayText, setOverlayText] = useState("");
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'sepia'>('none');

  // Gallery state
  const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const { mutate: createStory, isPending } = useCreateStory({
    mutation: {
      onSuccess: () => router.back(),
      onError: (err: any) => {
        Alert.alert("Error", err?.message || "Failed to create story");
      },
    },
  });

  // Request permission and load gallery on mount / mediaType change
  useEffect(() => {
    loadGallery(true);
  }, [mediaType]);

  const loadGallery = async (reset = false) => {
    if (!reset && (!hasNextPage || isFetchingMore)) return;

    if (reset) {
      setIsLoadingGallery(true);
      setGalleryAssets([]);
      setEndCursor(undefined);
      setHasNextPage(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setHasPermission(false);
        return;
      }
      setHasPermission(true);

      const result = await MediaLibrary.getAssetsAsync({
        mediaType: mediaType === 'image'
          ? MediaLibrary.MediaType.photo
          : MediaLibrary.MediaType.video,
        first: 60,
        after: reset ? undefined : endCursor,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      setGalleryAssets(prev => reset ? result.assets : [...prev, ...result.assets]);
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingGallery(false);
      setIsFetchingMore(false);
    }
  };

  const handleSelectAsset = (asset: MediaLibrary.Asset) => {
    setSelectedMedia({ uri: asset.uri, type: mediaType });
  };

  const handleCreate = () => {
    if (!selectedMedia) {
      Alert.alert("Error", "Please select media first");
      return;
    }
    createStory({
      data: {
        mediaUrl: selectedMedia.uri,
        mediaType: selectedMedia.type,
        duration: 5,
      },
    });
  };

  const renderGalleryItem = ({ item }: { item: MediaLibrary.Asset }) => (
    <TouchableOpacity
      onPress={() => handleSelectAsset(item)}
      activeOpacity={0.85}
      style={{ width: ITEM_SIZE, height: ITEM_SIZE, margin: 0.5 }}
    >
      <Image
        source={{ uri: item.uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <HugeiconsIcon icon={Video01Icon} size={14} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  // ── PREVIEW SCREEN ──────────────────────────────────────────────────────────
  if (selectedMedia) {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: selectedMedia.uri }}
          style={styles.fullPreview}
          contentFit="cover"
          tintColor={
            filter === 'grayscale' ? 'gray' :
            filter === 'sepia' ? '#704214' :
            undefined
          }
        />

        {overlayText !== "" && (
          <View style={styles.overlayTextWrapper}>
            <Text style={styles.overlayTextContent}>{overlayText}</Text>
          </View>
        )}

        {/* Header */}
        <View style={[styles.overlayHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.iconButton}>
            <HugeiconsIcon icon={Cancel01Icon} size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.overlayFooter, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.textInputWrapper}>
            <TextInput
              placeholder="Type something..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              style={styles.overlayInput}
              value={overlayText}
              onChangeText={setOverlayText}
            />
          </View>

          <View style={styles.filterRow}>
            {(['none', 'grayscale', 'sepia'] as const).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              >
                <Text style={styles.filterBtnText}>
                  {f === 'none' ? 'None' : f === 'grayscale' ? 'Gray' : 'Sepia'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isPending}
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.shareButtonText}>Share to Story</Text>
                <HugeiconsIcon icon={Tick01Icon} size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── GALLERY SCREEN ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <HugeiconsIcon icon={Cancel01Icon} size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Story</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Media type tabs */}
      <View style={[styles.selectorType, { borderBottomColor: colors.border ?? 'rgba(0,0,0,0.08)' }]}>
        {(['image', 'video'] as const).map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setMediaType(type)}
            style={[
              styles.typeTab,
              mediaType === type && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
          >
            <HugeiconsIcon
              icon={type === 'image' ? Image01Icon : Video01Icon}
              size={18}
              color={mediaType === type ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.typeText, { color: mediaType === type ? colors.primary : colors.mutedForeground }]}>
              {type === 'image' ? 'Photos' : 'Videos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Permission denied */}
      {!hasPermission && !isLoadingGallery && (
        <View style={styles.centeredMessage}>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, textAlign: 'center', marginBottom: 12 }}>
            Gallery access is required to select media.
          </Text>
          <TouchableOpacity onPress={() => loadGallery(true)} style={[styles.shareButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.shareButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading skeleton */}
      {isLoadingGallery && (
        <View style={styles.centeredMessage}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 12, fontSize: 13 }}>Loading gallery…</Text>
        </View>
      )}

      {/* Gallery grid */}
      {!isLoadingGallery && hasPermission && (
        <FlatList
          data={galleryAssets}
          keyExtractor={item => item.id}
          renderItem={renderGalleryItem}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          onEndReached={() => loadGallery(false)}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centeredMessage}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                No {mediaType === 'image' ? 'photos' : 'videos'} found.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  selectorType: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    gap: 7,
  },
  typeText: { fontWeight: '600', fontSize: 13 },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    padding: 3,
  },

  // Preview
  previewContainer: { flex: 1, backgroundColor: '#000' },
  fullPreview: { width, height },
  overlayTextWrapper: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayTextContent: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 20,
  },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  overlayFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputWrapper: { width: '100%', marginBottom: 16 },
  overlayInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 11,
    fontSize: 15,
  },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  filterBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 8,
  },
  shareButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});