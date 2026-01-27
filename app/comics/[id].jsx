import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getComic, deleteComic } from "../../utils/appwrite";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

export default function ComicDetailScreen() {
  const { id } = useLocalSearchParams();
  const isFocused = useIsFocused();
  const [comic, setComic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComic = async () => {
      try {
        setLoading(true);
        const selectedComic = await getComic(id);
        setComic(selectedComic);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && isFocused) {
      fetchComic();
    }
  }, [id, isFocused]);

  const handleDelete = async () => {
    Alert.alert(
      "Delete Comic",
      `Are you sure you want to delete "${comic.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteComic(comic.$id);
              Alert.alert(
                "Deleted",
                `${comic.title} has been removed from your collection.`,
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ],
              );
            } catch (err) {
              Alert.alert("Error", "Failed to delete comic. Please try again.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={24}
          color={i <= rating ? "#FFD700" : "#555"}
          style={{ marginRight: 4 }}
        />,
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.loadingText}>Loading comic details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#CF6679" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#000" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!comic) {
    return null;
  }

  const statusConfig = {
    read: { label: "Read", color: "#03DAC6", icon: "checkmark-circle" },
    "to-read": { label: "To Read", color: "#BB86FC", icon: "bookmark" },
  };

  const config = statusConfig[comic.status] || statusConfig["to-read"];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {comic.coverImage ? (
            <Image
              source={{
                uri: getOptimizedImageUrl(comic.coverImage, 800, 1200),
              }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="book" size={100} color="#555" />
            </View>
          )}
          <View style={styles.imageGradient} />
        </View>

        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>{comic.title}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: config.color }]}
            >
              <Ionicons name={config.icon} size={16} color="#000" />
              <Text style={styles.statusBadgeText}>{config.label}</Text>
            </View>
          </View>

          {comic.status === "read" && comic.rating > 0 && (
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Your Rating</Text>
              {renderStars(comic.rating)}
              <Text style={styles.ratingValue}>{comic.rating} out of 5</Text>
            </View>
          )}

          {comic.description && (
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color="#BB86FC" />
                <Text style={styles.sectionLabel}>Description</Text>
              </View>
              <Text style={styles.description}>{comic.description}</Text>
            </View>
          )}

          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/comics/edit/${comic.$id}`)}
            >
              <Ionicons name="create" size={20} color="#000" />
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="trash" size={20} color="#000" />
              )}
              <Text style={styles.deleteButtonText}>
                {deleting ? "Deleting..." : "Delete Comic"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  loadingText: {
    color: "#BB86FC",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "transparent",
  },
  errorText: {
    color: "#CF6679",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BB86FC",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
  },
  backButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageContainer: {
    width: "100%",
    height: 500,
    backgroundColor: "#121212",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(to top, #0A0A0A, transparent)",
  },
  content: {
    padding: 24,
    backgroundColor: "transparent",
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
    color: "#fff",
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusBadgeText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  ratingSection: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  ratingValue: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "600",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  description: {
    fontSize: 16,
    color: "#E1E1E1",
    lineHeight: 26,
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    letterSpacing: 0.3,
  },
  actionsSection: {
    gap: 14,
    marginTop: 16,
    paddingBottom: 20,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#BB86FC",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#BB86FC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  editButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 17,
  },
  deleteButton: {
    flexDirection: "row",
    backgroundColor: "#CF6679",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#CF6679",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  deleteButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 17,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
