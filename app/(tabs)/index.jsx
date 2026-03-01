import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import { Link, router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getComics } from "../../utils/appwrite";
import { getOptimizedImageUrl } from "../../utils/cloudinary";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 24;

function FAB({ onPress }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.fab}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Add a new comic"
        accessibilityHint="Opens the form to add a new comic to your shelf"
      >
        <Ionicons name="add" size={20} color="#1A1A2E" style={styles.fabIcon} />
        <Text style={styles.fabLabel}>Add Comic</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ComicsScreen({ statusFilter = null }) {
  const [comics, setComics] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const isFocused = useIsFocused();

  const fetchComics = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await getComics();
      console.log("Fetched comics:", response);

      if (Array.isArray(response)) {
        setComics(response);
      } else {
        console.error("Invalid response format:", response);
        setError("Failed to load comics");
      }
    } catch (err) {
      console.error("Error fetching comics:", err);
      setError(err.message || "Failed to load comics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredComics = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    let items = comics;
    if (statusFilter) {
      items = items.filter((c) => (c.status || "").toString() === statusFilter);
    }
    if (!q) return items;
    return items.filter((c) => {
      const title = (c.title || c.name || "").toString().toLowerCase();
      const author = (c.author || c.creator || c.writer || "")
        .toString()
        .toLowerCase();
      const desc = (c.description || c.desc || "").toString().toLowerCase();
      return title.includes(q) || author.includes(q) || desc.includes(q);
    });
  }, [comics, searchQuery, statusFilter]);

  const statsText = useMemo(() => {
    const total = comics.length;
    const readCount = comics.filter((comic) => comic.status === "read").length;
    const toReadCount = comics.filter(
      (comic) => comic.status === "to-read",
    ).length;

    if (statusFilter === "read") {
      return `${readCount} of ${total} comics read`;
    }

    if (statusFilter === "to-read") {
      return `${toReadCount} of ${total} comics to read`;
    }

    return `${total} comics in total`;
  }, [comics, statusFilter]);

  useEffect(() => {
    if (isFocused) {
      fetchComics();
    }
  }, [isFocused]);

  const renderComic = ({ item, index }) => {
    if (!item) return null;

    const renderStars = (rating) => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <Ionicons
            key={i}
            name={i <= rating ? "star" : "star-outline"}
            size={14}
            color={i <= rating ? "#FFD700" : "#555"}
            style={{ marginRight: 2 }}
          />,
        );
      }
      return <View style={styles.starsContainer}>{stars}</View>;
    };

    const statusConfig = {
      read: { label: "Read", color: "#03DAC6", icon: "checkmark-circle" },
      "to-read": { label: "To Read", color: "#BB86FC", icon: "bookmark" },
    };

    const config = statusConfig[item.status] || statusConfig["to-read"];

    return (
      <TouchableOpacity
        style={[styles.comicCard, { width: CARD_WIDTH }]}
        onPress={() => {
          if (item.$id) {
            router.push(`/comics/${item.$id}`);
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {item.coverImage ? (
            <Image
              source={{ uri: getOptimizedImageUrl(item.coverImage, 300, 450) }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="book" size={60} color="#555" />
              <Text style={styles.placeholderText}>No Cover</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={16} color="#000" />
          </View>
        </View>
        <View style={styles.comicInfo}>
          <Text style={styles.comicTitle} numberOfLines={2}>
            {item.title || "Untitled"}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name={config.icon} size={14} color={config.color} />
            <Text style={[styles.comicStatus, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
          {item.rating > 0 && (
            <View style={styles.ratingRow}>{renderStars(item.rating)}</View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BB86FC" />
        <Text style={styles.loadingText}>Loading your collection...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#CF6679" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchComics()}
        >
          <Ionicons
            name="refresh"
            size={20}
            color="#000"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={80} color="#555" />
      <Text style={styles.emptyTitle}>No Comics Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start building your collection by tapping the + button below
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search comics by title, author, or description"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          accessibilityLabel="Search comics"
          accessible={true}
          returnKeyType="search"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            accessibilityLabel="Clear search"
            style={styles.clearButton}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.headerSpace}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>{statsText}</Text>
        </View>
        <FAB onPress={() => router.push("/add-comic")} />
      </View>

      <FlatList
        data={filteredComics}
        renderItem={renderComic}
        keyExtractor={(item) => item.$id}
        style={styles.list}
        contentContainerStyle={
          filteredComics.length === 0 ? styles.emptyList : { paddingBottom: 32 }
        }
        numColumns={2}
        columnWrapperStyle={filteredComics.length > 0 ? styles.row : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchComics(true)}
            tintColor="#BB86FC"
            colors={["#BB86FC"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export default function HomeScreen() {
  return <ComicsScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0B1020",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B1020",
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
    backgroundColor: "#0B1020",
  },
  errorText: {
    color: "#CF6679",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#BB86FC",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
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
  retryButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerSpace: {
    marginBottom: 16,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  logo: {
    width: 180,
    height: "100%",
  },
  statsContainer: {
    backgroundColor: "rgba(187, 134, 252, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(187, 134, 252, 0.3)",
  },
  statsText: {
    color: "#BB86FC",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1724",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
  },
  list: {
    flex: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  comicCard: {
    width: CARD_WIDTH,
    backgroundColor: "rgba(30, 30, 30, 0.95)",
    borderRadius: 16,
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(187, 134, 252, 0.2)",
  },
  imageContainer: {
    width: "100%",
    height: 260,
    backgroundColor: "#0A0A0A",
    position: "relative",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
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
  placeholderText: {
    color: "#777",
    fontSize: 14,
    marginTop: 12,
    fontWeight: "600",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 24,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  comicInfo: {
    padding: 14,
    backgroundColor: "#1E1E1E",
    minHeight: 100,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  comicTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  comicStatus: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "600",
  },
  ratingRow: {
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BB86FC",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minHeight: 40,
    ...Platform.select({
      ios: {
        shadowColor: "#9B59FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabIcon: {
    marginRight: 6,
  },
  fabLabel: {
    color: "#1A1A2E",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
