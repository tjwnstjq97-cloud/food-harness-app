/**
 * 즐겨찾기 탭
 * - user_id 기반 소유권 분리
 * - KR / GLOBAL 리전 필터 탭
 * - 저장 날짜 표시
 * - Pull-to-refresh
 * - 스와이프 좌측 → 삭제 (PanResponder 내장 구현)
 */
import { useState, useCallback, useMemo, useRef } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Animated,
  PanResponder,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { useFavorites } from "../../src/hooks/useFavorites";
import { useSelectedRestaurantStore } from "../../src/stores/selectedRestaurantStore";
import { RestaurantCard } from "../../src/components/RestaurantCard";
import { LoadingView, ErrorView, EmptyView } from "../../src/components/StateViews";
import type { FavoriteRow } from "../../src/types/restaurant";
import type { Restaurant } from "../../src/types/restaurant";

type RegionFilter = "ALL" | "KR" | "GLOBAL";
type SortOption = "newest" | "oldest" | "name";

// ── 스와이프 삭제 래퍼 ──────────────────────────────
const SWIPE_THRESHOLD = 80;

interface SwipeableRowProps {
  onDelete: () => void;
  children: React.ReactNode;
}
function SwipeableRow({ onDelete, children }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) {
          translateX.setValue(Math.max(gs.dx, -120));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          // 삭제 확인 후 스냅백
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
          }).start(() => onDelete());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const deleteOpacity = translateX.interpolate({
    inputRange: [-120, -40, 0],
    outputRange: [1, 0.6, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={swipeStyles.container}>
      {/* 뒤에 있는 삭제 영역 */}
      <Animated.View style={[swipeStyles.deleteArea, { opacity: deleteOpacity }]}>
        <Text style={swipeStyles.deleteText}>🗑️{"\n"}삭제</Text>
      </Animated.View>
      {/* 앞에 있는 카드 */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  container: { position: "relative" },
  deleteArea: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
// ────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const router = useRouter();
  const setSelected = useSelectedRestaurantStore((s) => s.setSelected);

  const {
    data: favorites,
    isLoading,
    isError,
    error,
    refetch,
    removeFavorite,
    isFavorite,
  } = useFavorites();

  // 리전 필터 + 정렬 적용
  const filteredFavorites = useMemo(() => {
    if (!favorites) return [];
    const filtered =
      regionFilter === "ALL"
        ? [...favorites]
        : favorites.filter((f) => f.restaurant_region === regionFilter);

    switch (sortOption) {
      case "oldest":
        return filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "name":
        return filtered.sort((a, b) =>
          a.restaurant_name.localeCompare(b.restaurant_name, "ko")
        );
      case "newest":
      default:
        return filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [favorites, regionFilter, sortOption]);

  const handleCardPress = useCallback(
    (item: FavoriteRow) => {
      const partial: Restaurant = {
        id: item.restaurant_id,
        name: item.restaurant_name,
        region: item.restaurant_region,
        category: "",
        address: "",
        latitude: 0,
        longitude: 0,
      };
      setSelected(partial);
      router.push(`/restaurant/${item.restaurant_id}`);
    },
    [setSelected, router]
  );

  const handleRemove = useCallback(
    (restaurantId: string, name: string) => {
      Alert.alert("즐겨찾기 삭제", `"${name}"을(를) 즐겨찾기에서 삭제할까요?`, [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => removeFavorite.mutate(restaurantId),
        },
      ]);
    },
    [removeFavorite]
  );

  if (authLoading || isLoading) {
    return <LoadingView message="즐겨찾기 불러오는 중..." />;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyView
          title="로그인이 필요합니다"
          subtitle="즐겨찾기를 사용하려면 로그인해주세요."
        />
      </View>
    );
  }

  if (isError) {
    return (
      <ErrorView
        message={error instanceof Error ? error.message : "즐겨찾기를 불러오지 못했습니다."}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>즐겨찾기</Text>
        <Text style={styles.count}>{filteredFavorites.length}곳</Text>
      </View>

      {/* KR / GLOBAL 필터 탭 */}
      <View style={styles.filterTabs}>
        {(["ALL", "KR", "GLOBAL"] as RegionFilter[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, regionFilter === tab && styles.filterTabActive]}
            onPress={() => setRegionFilter(tab)}
          >
            <Text style={[styles.filterTabText, regionFilter === tab && styles.filterTabTextActive]}>
              {tab === "ALL" ? "전체" : tab === "KR" ? "🇰🇷 국내" : "🌏 해외"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 정렬 옵션 */}
      <View style={styles.sortRow}>
        {(
          [
            { key: "newest", label: "최신순" },
            { key: "oldest", label: "오래된순" },
            { key: "name", label: "이름순" },
          ] as { key: SortOption; label: string }[]
        ).map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortOption === opt.key && styles.sortChipActive]}
            onPress={() => setSortOption(opt.key)}
          >
            <Text style={[styles.sortChipText, sortOption === opt.key && styles.sortChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredFavorites as FavoriteRow[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          filteredFavorites.length === 0 && styles.emptyList,
        ]}
        // 성능 튜닝 (Phase 23)
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#FF6B35"
            colors={["#FF6B35"]}
          />
        }
        ListEmptyComponent={
          <EmptyView
            title={
              regionFilter === "ALL"
                ? "저장된 즐겨찾기가 없습니다"
                : regionFilter === "KR"
                ? "국내 즐겨찾기가 없습니다"
                : "해외 즐겨찾기가 없습니다"
            }
            subtitle={
              regionFilter === "ALL"
                ? "검색 결과에서 ♡를 눌러 추가하세요."
                : "다른 필터를 선택해보세요."
            }
            actionLabel={regionFilter === "ALL" ? "음식점 검색하러 가기" : undefined}
            onAction={regionFilter === "ALL" ? () => router.push("/") : undefined}
          />
        }
        renderItem={({ item }) => (
          <SwipeableRow
            onDelete={() => handleRemove(item.restaurant_id, item.restaurant_name)}
          >
            <RestaurantCard
              restaurant={{
                id: item.restaurant_id,
                name: item.restaurant_name,
                region: item.restaurant_region,
                category: "",
                address: "",
                latitude: 0,
                longitude: 0,
              }}
              onPress={() => handleCardPress(item)}
              showFavorite
              isFavorite={isFavorite(item.restaurant_id)}
              onFavoriteToggle={() =>
                handleRemove(item.restaurant_id, item.restaurant_name)
              }
              savedAt={item.created_at}
            />
          </SwipeableRow>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  count: { fontSize: 14, color: "#888" },

  /* 리전 필터 탭 */
  filterTabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 12,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabActive: { borderBottomColor: "#FF6B35" },
  filterTabText: { fontSize: 13, color: "#999", fontWeight: "500" },
  filterTabTextActive: { color: "#FF6B35", fontWeight: "700" },

  /* 정렬 */
  sortRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
  },
  sortChipActive: { backgroundColor: "#FFF0EB" },
  sortChipText: { fontSize: 12, color: "#888", fontWeight: "500" },
  sortChipTextActive: { color: "#FF6B35", fontWeight: "700" },

  list: { padding: 12, paddingBottom: 24 },
  emptyList: { flex: 1 },
  sep: { height: 8 },
});
