import { useRouter } from "expo-router";
import { Search, Plus, Sparkles } from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useCoaches, defaultCategories } from "@/contexts/CoachContext";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48 - 12) / 2;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { allCoaches } = useCoaches();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredCoaches = useMemo(() => {
    return allCoaches.filter((coach) => {
      const matchesSearch =
        coach.name.toLowerCase().includes(search.toLowerCase()) ||
        coach.tagline.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || coach.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory, allCoaches]);

  const handleCoachPress = (coachId: string) => {
    router.push(`/coach/${coachId}`);
  };

  const handleCreateCoach = () => {
    router.push("/coach/edit");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Find Your Coach</Text>
            <Text style={styles.subtitle}>Expert guidance for every goal</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCoach}
            activeOpacity={0.8}
          >
            <Plus color={Colors.white} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search color={Colors.textMuted} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coaches..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {defaultCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCoaches}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.coachCard}
            onPress={() => handleCoachPress(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarContainer, { backgroundColor: item.color + '15' }]}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              {item.isCustom && (
                <View style={[styles.customBadge, { backgroundColor: item.color }]}>
                  <Sparkles color={Colors.white} size={10} />
                </View>
              )}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.coachName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.coachTagline} numberOfLines={2}>
                {item.tagline}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: item.color + '15' }]}>
                <Text style={[styles.categoryBadgeText, { color: item.color }]}>
                  {item.category}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.navy,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text,
  },
  categoriesWrapper: {
    marginTop: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  gridContainer: {
    padding: 24,
    paddingTop: 20,
  },
  row: {
    gap: 12,
  },
  coachCard: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  avatarContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 12,
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  customBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 16,
    paddingTop: 4,
    alignItems: "center",
  },
  coachName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.navy,
    textAlign: "center",
  },
  coachTagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  categoryBadge: {
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
