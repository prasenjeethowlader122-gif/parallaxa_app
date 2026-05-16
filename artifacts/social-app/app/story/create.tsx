import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { useCreateStory } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Cancel01Icon, Image01Icon, Video01Icon, Tick01Icon, SquareIcon } from "@hugeicons/core-free-icons";
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ScrollView as RNScrollView } from "react-native";

const { width, height } = Dimensions.get("window");

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#4CD964",
  "#5AC8FA",
  "#007AFF",
  "#5856D6",
  "#FF2D55",
];

export default function CreateStoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string, type: 'image' | 'video' } | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [overlayText, setOverlayText] = useState("");
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'sepia'>('none');
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textHasBackground, setTextHasBackground] = useState(false);

  const { mutate: createStory, isPending } = useCreateStory({
    mutation: {
      onSuccess: () => {
        router.back();
      },
      onError: (err: any) => {
        Alert.alert("Error", err?.message || "Failed to create story");
      },
    },
  });

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia({
        uri: result.assets[0].uri,
        type: mediaType
      });
    }
  };

  const handleCreate = () => {
    if (!selectedMedia) {
      Alert.alert("Error", "Please select media first");
      return;
    }

    // In a real app, you would upload the file here and get a URL.
    // For this demo, we'll use the local URI as a placeholder.
    createStory({
      data: {
        mediaUrl: selectedMedia.uri,
        mediaType: selectedMedia.type,
        duration: 5,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedMedia ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: selectedMedia.uri }}
            style={[
              styles.fullPreview,
              filter === 'grayscale' && { tintColor: 'gray' },
              filter === 'sepia' && { tintColor: '#704214' }
            ]}
            contentFit="cover"
          />

          {overlayText !== "" && (
            <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{
                color: textColor,
                fontSize: 32,
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: textHasBackground ? 'rgba(0,0,0,0.6)' : 'transparent',
                paddingHorizontal: 20,
                borderRadius: 8,
              }}>
                {overlayText}
              </Text>
            </View>
          )}

          <View style={[styles.overlayHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.iconButton}>
              <HugeiconsIcon icon={Cancel01Icon} size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={[styles.overlayFooter, { paddingBottom: insets.bottom + 20 }]}>
            <View style={{ width: '100%', paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, fontSize: 16 }}
                value={overlayText}
                onChangeText={setOverlayText}
              />
              <TouchableOpacity
                onPress={() => setTextHasBackground(!textHasBackground)}
                style={[styles.iconButton, { backgroundColor: textHasBackground ? colors.primary : 'rgba(0,0,0,0.5)' }]}
              >
                <HugeiconsIcon icon={SquareIcon} size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <RNScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, marginBottom: 20 }}
            >
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setTextColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c,
                    borderWidth: 2,
                    borderColor: textColor === c ? '#fff' : 'transparent',
                  }}
                />
              ))}
            </RNScrollView>

            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
              <TouchableOpacity onPress={() => setFilter('none')} style={[styles.filterCircle, filter === 'none' && styles.filterCircleActive]}>
                <View style={[styles.filterPreview, { backgroundColor: '#ccc' }]} />
                <Text style={styles.filterLabel}>None</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter('grayscale')} style={[styles.filterCircle, filter === 'grayscale' && styles.filterCircleActive]}>
                <View style={[styles.filterPreview, { backgroundColor: 'gray' }]} />
                <Text style={styles.filterLabel}>Gray</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter('sepia')} style={[styles.filterCircle, filter === 'sepia' && styles.filterCircleActive]}>
                <View style={[styles.filterPreview, { backgroundColor: '#704214' }]} />
                <Text style={styles.filterLabel}>Sepia</Text>
              </TouchableOpacity>
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
      ) : (
        <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <HugeiconsIcon icon={Cancel01Icon} size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Story</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.selectorType}>
            <TouchableOpacity
              onPress={() => setMediaType('image')}
              style={[styles.typeTab, mediaType === 'image' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <HugeiconsIcon icon={Image01Icon} size={20} color={mediaType === 'image' ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.typeText, { color: mediaType === 'image' ? colors.primary : colors.mutedForeground }]}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMediaType('video')}
              style={[styles.typeTab, mediaType === 'video' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <HugeiconsIcon icon={Video01Icon} size={20} color={mediaType === 'video' ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.typeText, { color: mediaType === 'video' ? colors.primary : colors.mutedForeground }]}>Videos</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={pickMedia} style={styles.pickButton}>
            <View style={[styles.pickIconContainer, { backgroundColor: colors.card }]}>
              <HugeiconsIcon icon={Image01Icon} size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.pickText, { color: colors.foreground }]}>Select from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  selectorType: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  typeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  pickButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullPreview: {
    width: width,
    height: height,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  filterCircle: {
    alignItems: 'center',
    gap: 4,
    opacity: 0.6,
  },
  filterCircleActive: {
    opacity: 1,
  },
  filterPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  filterLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
