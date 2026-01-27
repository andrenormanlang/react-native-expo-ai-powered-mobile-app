import React, { useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  createComic,
  fetchGeneratedComicDescription,
} from "../../utils/appwrite";
import { uploadToCloudinary } from "../../utils/cloudinary";

const AddComicScreen = () => {
  const TITLE_MAX_LENGTH = 255;

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("to-read");
  const [rating, setRating] = useState("0");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need camera roll permissions to upload comic covers.",
        [{ text: "OK" }],
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
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const normalizedTitle = String(title ?? "").trim();

    if (!normalizedTitle) {
      Alert.alert("Error", "Please enter a comic title");
      return;
    }

    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
      Alert.alert(
        "Title too long",
        `Please keep the title under ${TITLE_MAX_LENGTH} characters.`
      );
      return;
    }

    const ratingNum = parseInt(rating);
    if (
      status === "read" &&
      (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)
    ) {
      Alert.alert("Error", "Please enter a valid rating between 1 and 5");
      return;
    }

    try {
      setLoading(true);
      setGeneratingDesc(true);

      // Upload image if one was selected
      let coverImage = null;
      if (image) {
        coverImage = await uploadToCloudinary(image);
      }

      console.log("Generating description for:", {
        title: normalizedTitle,
        status,
        rating: status === "read" ? ratingNum : 0,
      });

      // Generate description before creating the comic
      const description = await fetchGeneratedComicDescription(
        normalizedTitle,
        status,
        status === "read" ? ratingNum : 0,
      );

      if (!description) {
        throw new Error("Failed to generate description");
      }

      // Create comic with the generated description
      await createComic({
        title: normalizedTitle,
        status,
        rating: status === "read" ? ratingNum : 0,
        coverImage,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Alert.alert(
        "Success!",
        `${normalizedTitle} has been added to your collection.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to add comic. Please try again.",
      );
    } finally {
      setGeneratingDesc(false);
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) {
      return generatingDesc ? "Generating Desc..." : "Adding Comic...";
    }
    return "Add Comic";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="book" size={16} color="#BB86FC" /> Comic Title *
            </Text>
            <TextInput
              style={[styles.input, !title.trim() && styles.inputEmpty]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter comic title"
              placeholderTextColor="#666"
              editable={!loading}
              maxLength={TITLE_MAX_LENGTH}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="image" size={16} color="#BB86FC" /> Cover Image
            </Text>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickImage}
              disabled={loading}
              activeOpacity={0.8}
            >
              {image ? (
                <>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.changeImageText}>Change Image</Text>
                  </View>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={48}
                    color="#666"
                  />
                  <Text style={styles.imageButtonText}>Select Cover Image</Text>
                  <Text style={styles.imageHint}>
                    Tap to choose from gallery
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="bookmark" size={16} color="#BB86FC" /> Status *
            </Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "read" && styles.statusButtonActive,
                ]}
                onPress={() => setStatus("read")}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={status === "read" ? "#000" : "#666"}
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
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === "to-read" && styles.statusButtonActive,
                ]}
                onPress={() => setStatus("to-read")}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={20}
                  color={status === "to-read" ? "#000" : "#666"}
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
            </View>
          </View>

          {status === "read" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="star" size={16} color="#FFD700" /> Rating (1-5)
                *
              </Text>
              <View style={styles.starRatingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star.toString())}
                    disabled={loading}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={parseInt(rating) >= star ? "star" : "star-outline"}
                      size={40}
                      color={parseInt(rating) >= star ? "#FFD700" : "#444"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {rating === "0" || !rating
                  ? "Tap a star to rate"
                  : `${rating} out of 5 stars`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !title.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.submitButtonText}>{getButtonText()}</Text>
              </View>
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="#000" />
                <Text style={styles.submitButtonText}>Add Comic</Text>
              </>
            )}
          </TouchableOpacity>

          {generatingDesc && (
            <View style={styles.aiIndicator}>
              <ActivityIndicator size="small" color="#BB86FC" />
              <Text style={styles.aiText}>
                ✨ AI is generating description...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#120A1A",
  },
  container: {
    flex: 1,
    backgroundColor: "#120A1A",
  },
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: "#120A1A",
  },
  form: {
    padding: 20,
    backgroundColor: "transparent",
  },
  inputGroup: {
    marginBottom: 24,
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
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#BB86FC",
    padding: 18,
    borderRadius: 14,
    marginTop: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#BB86FC",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: "#333",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(187, 134, 252, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(187, 134, 252, 0.3)",
  },
  aiText: {
    color: "#BB86FC",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default AddComicScreen;
