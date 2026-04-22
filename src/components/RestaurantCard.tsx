/**
 * RestaurantCard — 음식점 목록 카드 컴포넌트
 * 검색 결과, 즐겨찾기, 히스토리에서 공통으로 사용.
 * - thumbnail: 이미지가 있으면 왼쪽에 표시
 * - savedAt: 즐겨찾기 저장일 표시
 * - visitCount: 방문 횟수 배지 (2회 이상)
 */
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import type { Restaurant } from "../types/restaurant";
import { localizeCategory } from "../utils/categoryMap";

interface Props {
  restaurant: Restaurant;
  onPress?: (restaurant: Restaurant) => void;
  /** 즐겨찾기 버튼 표시 */
  showFavorite?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (restaurant: Restaurant) => void;
  /** 방문 일시 표시 (히스토리용) */
  visitedAt?: string;
  /** 즐겨찾기 저장 일시 */
  savedAt?: string;
  /** 방문 횟수 (2 이상이면 배지 표시) */
  visitCount?: number;
}

export function RestaurantCard({
  restaurant,
  onPress,
  showFavorite = false,
  isFavorite = false,
  onFavoriteToggle,
  visitedAt,
  savedAt,
  visitCount,
}: Props) {
  const hasThumbnail = !!restaurant.thumbnailUrl;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => onPress?.(restaurant)}
    >
      <View style={styles.row}>
        {/* 썸네일 */}
        {hasThumbnail && (
          <Image
            source={{ uri: restaurant.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        <View style={styles.body}>
          <View style={styles.top}>
            <Text style={styles.name} numberOfLines={1}>
              {restaurant.name}
            </Text>
            {showFavorite && (
              <TouchableOpacity
                onPress={() => onFavoriteToggle?.(restaurant)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.heart, isFavorite && styles.heartActive]}>
                  {isFavorite ? "♥" : "♡"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.meta}>
            {!!restaurant.category && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{localizeCategory(restaurant.category)}</Text>
              </View>
            )}
            <View style={[styles.badge, styles.regionBadge]}>
              <Text style={[styles.badgeText, styles.regionText]}>
                {restaurant.region === "KR" ? "🇰🇷 KR" : "🌏 GLOBAL"}
              </Text>
            </View>
            {visitCount !== undefined && visitCount >= 2 && (
              <View style={[styles.badge, styles.visitBadge]}>
                <Text style={[styles.badgeText, styles.visitText]}>
                  {visitCount}회 방문
                </Text>
              </View>
            )}
          </View>

          {!!restaurant.address && (
            <Text style={styles.address} numberOfLines={1}>
              📍 {restaurant.address}
            </Text>
          )}

          {visitedAt && (
            <Text style={styles.metaDate}>
              방문: {new Date(visitedAt).toLocaleDateString("ko-KR")}
            </Text>
          )}
          {savedAt && (
            <Text style={styles.metaDate}>
              저장: {new Date(savedAt).toLocaleDateString("ko-KR")}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    flexShrink: 0,
  },
  body: { flex: 1, gap: 6 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", flex: 1 },
  heart: { fontSize: 20, color: "#ccc" },
  heartActive: { color: "#FF6B35" },
  meta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  badge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  regionBadge: { backgroundColor: "#FFF0EB" },
  visitBadge: { backgroundColor: "#E3F2FD" },
  badgeText: { fontSize: 11, color: "#555" },
  regionText: { color: "#FF6B35", fontWeight: "600" },
  visitText: { color: "#1565C0", fontWeight: "600" },
  address: { fontSize: 13, color: "#777" },
  metaDate: { fontSize: 11, color: "#aaa", marginTop: 1 },
});
