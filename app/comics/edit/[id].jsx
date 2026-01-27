import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getComic, updateComic } from "../../../utils/appwrite";
import { uploadToCloudinary } from "../../../utils/cloudinary";

export default function EditComicScreen() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("to-read");
  const [rating, setRating] = useState("0");

  const [coverImage, setCoverImage] = useState(null); // existing url
  const [localImage, setLocalImage] = useState(null); // local uri

  const canSave = useMemo(() => {
    if (!title.trim()) return false;

    if (status === "read") {
      const ratingNum = parseInt(rating, 10);
      return !Number.isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
    }

    return true;
  }, [title, status, rating]);

  useEffect(() => {
    const fetchComic = async () => {
      try {
        setLoading(true);
        const doc = await getComic(id);

        setTitle(doc?.title ?? "");
        setDescription(doc?.description ?? "");
        setStatus(doc?.status ?? "to-read");
        setRating(String(doc?.rating ?? 0));
        setCoverImage(doc?.coverImage ?? null);
        setLocalImage(null);
      } catch (err) {
        Alert.alert("Error", err?.message || "Failed to load comic details");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchComic();
  }, [id]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need photo library permissions to update the cover.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLocalImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert(
        "Check your inputs",
        status === "read"
          ? "Please provide a title and a rating from 1 to 5."
          : "Please provide a title."
      );
      return;
    }

    try {
      setSaving(true);

      const ratingNum = status === "read" ? parseInt(rating, 10) : 0;

      let nextCoverImage = coverImage;
      if (localImage) {
        nextCoverImage = await uploadToCloudinary(localImage);
      }

      await updateComic(id, {
        title: title.trim(),
        description: description.trim(),
        status,
        rating: ratingNum,
        coverImage: nextCoverImage,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Saved", "Comic details updated.", [
        {
          text: "OK",
          onPress: () => router.replace(`/comics/${id}`),
        },
      ]);
    } catch (err) {
      console.error("Error updating comic:", err);
      Alert.alert("Error", err?.message || "Failed to update comic");
    } finally {
      setSaving(false);
    }
  };

  const setStatusSafe = (nextStatus) => {
    setStatus(nextStatus);
    if (nextStatus !== "read") {
      setRating("0");
    }
  };

  const renderStarPicker = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Rating</Text>
      <View style={styles.starRatingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(String(star))}
            disabled={saving}
            style={styles.starButton}
          >
            <Ionicons
              name={parseInt(rating, 10) >= star ? "star" : "star-outline"}
              size={40}
              color={parseInt(rating, 10) >= star ? "#FFD700" : "#444"}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating === "0" || !rating ? "Tap a star to rate" : `${rating} out of 5 stars`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.loadingText}>Loading editor...</Text>
      </View>
    );
  }

  const previewUri = localImage || coverImage;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconButton}
            disabled={saving}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Comic</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cover</Text>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
              activeOpacity={0.9}
              disabled={saving}
            >
              {previewUri ? (
                <>
                  <Image source={{ uri: previewUri }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="image" size={18} color="#fff" />
                    <Text style={styles.changeImageText}>
                      {localImage ? "Change selected cover" : "Change cover"}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#BB86FC" />
                  <Text style={styles.imageButtonText}>Add a cover image</Text>
                  <Text style={styles.imageHint}>Optional</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, !title.trim() && styles.inputEmpty]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. One Piece Vol. 1"
              placeholderTextColor="#777"
              editable={!saving}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "to-read" && styles.statusButtonActive,
                ]}
                onPress={() => setStatusSafe("to-read")}
                disabled={saving}
              >
                <Ionicons
                  name="bookmark"
                  size={18}
                  color={status === "to-read" ? "#000" : "#888"}
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "to-read" && styles.statusButtonTextActive,
                  ]}
                >
                  To Read
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "read" && styles.statusButtonActive,
                ]}
                onPress={() => setStatusSafe("read")}
                disabled={saving}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={status === "read" ? "#000" : "#888"}
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    status === "read" && styles.statusButtonTextActive,
                  ]}
                >
                  Read
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {status === "read" && renderStarPicker()}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add your notes or a synopsis..."
              placeholderTextColor="#777"
              multiline
              editable={!saving}
            />
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!canSave || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!canSave || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="save" size={20} color="#000" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(30, 30, 30, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(187, 134, 252, 0.25)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#fff",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    color: "#fff",
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  inputEmpty: {
    borderColor: "#555",
  },
  imageButton: {
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#333",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    height: 280,
    overflow: "hidden",
    position: "relative",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageButtonText: {
    color: "#BB86FC",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  imageHint: {
    color: "#666",
    fontSize: 13,
    marginTop: 6,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  changeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderWidth: 2,
    borderColor: "#333",
    gap: 8,
  },
  statusButtonActive: {
    backgroundColor: "#BB86FC",
    borderColor: "#BB86FC",
    ...Platform.select({
      ios: {
        shadowColor: "#BB86FC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statusButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  statusButtonTextActive: {
    color: "#000",
  },
  starRatingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: "center",
    color: "#BBB",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderWidth: 1,
    borderColor: "#333",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#BB86FC",
    ...Platform.select({
      ios: {
        shadowColor: "#BB86FC",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveButtonDisabled: {
    backgroundColor: "#333",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    padding: 24,
  },
  loadingText: {
    color: "#BB86FC",
    fontSize: 16,
    marginTop: 14,
    fontWeight: "700",
  },
});
