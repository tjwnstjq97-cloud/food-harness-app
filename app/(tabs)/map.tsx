import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useRegion } from "../../src/providers/RegionProvider";
import { SearchBar } from "../../src/components/SearchBar";
import {
  EmptyView,
  ErrorView,
  OfflineView,
  SkeletonList,
  isOfflineError,
} from "../../src/components/StateViews";
import { useSearch, formatSearchDuration } from "../../src/hooks/useSearch";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useSelectedRestaurantStore } from "../../src/stores/selectedRestaurantStore";
import { useSearchHistoryStore } from "../../src/stores/searchHistoryStore";
import type { Restaurant } from "../../src/types/restaurant";
import { localizeCategory } from "../../src/utils/categoryMap";
import { cozyTheme } from "../../src/utils/theme";

const colors = cozyTheme.colors;

const QUICK_SEARCH_KR = [
  { label: "명동", query: "명동" },
  { label: "강남", query: "강남" },
  { label: "홍대", query: "홍대" },
  { label: "고기", query: "고기" },
  { label: "카페", query: "카페" },
  { label: "한식", query: "한식" },
];

const QUICK_SEARCH_GLOBAL = [
  { label: "Sushi", query: "sushi" },
  { label: "Pizza", query: "pizza" },
  { label: "Ramen", query: "ramen" },
  { label: "BBQ", query: "bbq" },
  { label: "Cafe", query: "cafe" },
  { label: "Burger", query: "burger" },
];

const MAP_HEIGHT = 300;

interface MarkerPosition {
  restaurant: Restaurant;
  left: `${number}%`;
  top: `${number}%`;
}

function getMarkerPositions(restaurants: Restaurant[]): MarkerPosition[] {
  if (restaurants.length === 0) return [];

  const withCoords = restaurants.filter(
    (restaurant) => restaurant.latitude !== 0 || restaurant.longitude !== 0
  );

  if (withCoords.length === 0) {
    return restaurants.slice(0, 8).map((restaurant, index) => ({
      restaurant,
      left: `${18 + (index % 3) * 26}%`,
      top: `${18 + Math.floor(index / 3) * 24}%`,
    }));
  }

  const lats = withCoords.map((restaurant) => restaurant.latitude);
  const lngs = withCoords.map((restaurant) => restaurant.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  return withCoords.slice(0, 10).map((restaurant) => {
    const x = ((restaurant.longitude - minLng) / lngRange) * 58 + 16;
    const y = ((maxLat - restaurant.latitude) / latRange) * 54 + 18;
    return {
      restaurant,
      left: `${x}%`,
      top: `${y}%`,
    };
  });
}

export default function MapScreen() {
  const { region, isKR } = useRegion();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const setSelected = useSelectedRestaurantStore((s) => s.setSelected);
  const { queries: recentQueries, addQuery } = useSearchHistoryStore();

  const quickSearchItems = isKR ? QUICK_SEARCH_KR : QUICK_SEARCH_GLOBAL;

  const { data, isLoading, isError, error, refetch, isFetching } = useSearch({
    query: submitted,
    enabled: !!submitted,
    limit: 18,
  });

  const restaurants = data?.restaurants ?? [];
  const markerPositions = useMemo(() => getMarkerPositions(restaurants), [restaurants]);

  const selectedRestaurant = useMemo(
    () =>
      restaurants.find((restaurant) => restaurant.id === selectedId) ??
      restaurants[0] ??
      null,
    [restaurants, selectedId]
  );

  const handleSearch = useCallback(
    (nextQuery?: string) => {
      const target = (nextQuery ?? query).trim();
      if (!target) return;
      addQuery(target);
      setQuery(target);
      setSubmitted(target);
      setSelectedId(null);
    },
    [addQuery, query]
  );

  const handleCardPress = useCallback(
    (restaurant: Restaurant) => {
      setSelected(restaurant);
      router.push(`/restaurant/${restaurant.id}`);
    },
    [router, setSelected]
  );

  const handleMarkerPress = (restaurant: Restaurant) => {
    setSelectedId(restaurant.id);
  };

  const clearQuery = () => {
    setQuery("");
    setSubmitted("");
    setSelectedId(null);
  };

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 2 && trimmed !== submitted) {
      setSubmitted(trimmed);
      setSelectedId(null);
    }
  }, [debouncedQuery, submitted]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>지도 탐색</Text>
          <Text style={styles.subtitle}>
            {isKR ? "네이버 기반 국내 탐색" : "구글 기반 글로벌 탐색"}
          </Text>
        </View>
        <View style={[styles.regionPill, isKR ? styles.regionPillKR : styles.regionPillGlobal]}>
          <Text style={[styles.regionPillText, isKR ? styles.regionTextKR : styles.regionTextGlobal]}>
            {isKR ? "🇰🇷 KR" : "🌏 GLOBAL"}
          </Text>
        </View>
      </View>

      <SearchBar
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          if (text.trim().length < 2) {
            setSubmitted("");
            setSelectedId(null);
          }
        }}
        onSubmit={() => handleSearch()}
        placeholder={isKR ? "지역이나 메뉴로 지도 탐색..." : "Search places on map..."}
        disabled={isFetching}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
      >
        {quickSearchItems.map(({ label, query: quickQuery }) => (
          <TouchableOpacity
            key={quickQuery}
            style={styles.quickChip}
            onPress={() => handleSearch(quickQuery)}
          >
            <Text style={styles.quickChipText}>{label}</Text>
          </TouchableOpacity>
        ))}
        {recentQueries.slice(0, 4).map((recentQuery) => (
          <TouchableOpacity
            key={`recent-${recentQuery}`}
            style={[styles.quickChip, styles.recentChip]}
            onPress={() => handleSearch(recentQuery)}
          >
            <Text style={styles.recentChipText}>{recentQuery}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading && <SkeletonList count={3} />}

      {isError && isOfflineError(error) && <OfflineView onRetry={() => refetch()} />}

      {isError && !isOfflineError(error) && (
        <ErrorView
          message={error instanceof Error ? error.message : "지도 탐색에 실패했습니다."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && !submitted && (
        <View style={styles.emptyState}>
          <EmptyView
            title="지도처럼 훑어보는 탐색 탭"
            subtitle="지역, 메뉴, 분위기 키워드로 검색하면 결과를 지도형 레이아웃과 함께 볼 수 있습니다."
            icon="🧭"
            fullScreen={false}
          />
        </View>
      )}

      {!isLoading && !isError && !!submitted && restaurants.length === 0 && (
        <View style={styles.emptyState}>
          <EmptyView
            title="지도에 표시할 결과가 없습니다"
            subtitle="다른 검색어로 다시 시도해보세요."
            icon="🗺️"
            fullScreen={false}
          />
        </View>
      )}

      {!isLoading && !isError && restaurants.length > 0 && (
        <>
          <View style={styles.resultHeader}>
            <Text style={styles.resultSummary}>
              {restaurants.length}곳 {data?.durationMs ? `· ${formatSearchDuration(data.durationMs)}` : ""}
            </Text>
            <TouchableOpacity onPress={clearQuery}>
              <Text style={styles.clearText}>초기화</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapCard}>
            <View style={styles.mapGrid}>
              {Array.from({ length: 5 }).map((_, index) => (
                <View
                  key={`h-${index}`}
                  style={[styles.mapLineHorizontal, { top: `${18 + index * 16}%` }]}
                />
              ))}
              {Array.from({ length: 4 }).map((_, index) => (
                <View
                  key={`v-${index}`}
                  style={[styles.mapLineVertical, { left: `${18 + index * 20}%` }]}
                />
              ))}
              {markerPositions.map(({ restaurant, left, top }) => {
                const active = restaurant.id === selectedRestaurant?.id;
                return (
                  <TouchableOpacity
                    key={restaurant.id}
                    style={[
                      styles.marker,
                      active && styles.markerActive,
                      {
                        left,
                        top,
                        backgroundColor: isKR ? colors.kr : colors.global,
                      },
                    ]}
                    onPress={() => handleMarkerPress(restaurant)}
                  >
                    <Text style={styles.markerText}>{active ? "●" : "•"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedRestaurant && (
              <View style={styles.mapPreviewCard}>
                <View style={styles.mapPreviewTop}>
                  <Text style={styles.mapPreviewName} numberOfLines={1}>
                    {selectedRestaurant.name}
                  </Text>
                  {!!selectedRestaurant.category && (
                    <View style={styles.mapPreviewBadge}>
                      <Text style={styles.mapPreviewBadgeText}>
                        {localizeCategory(selectedRestaurant.category)}
                      </Text>
                    </View>
                  )}
                </View>
                {!!selectedRestaurant.address && (
                  <Text style={styles.mapPreviewAddress} numberOfLines={1}>
                    {selectedRestaurant.address}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.mapPreviewButton}
                  onPress={() => handleCardPress(selectedRestaurant)}
                >
                  <Text style={styles.mapPreviewButtonText}>상세 보기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <FlatList
            data={restaurants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultList}
            showsVerticalScrollIndicator={false}
            // 성능 튜닝 (Phase 23)
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={7}
            removeClippedSubviews
            renderItem={({ item }) => {
              const active = item.id === selectedRestaurant?.id;
              return (
                <TouchableOpacity
                  style={[styles.resultCard, active && styles.resultCardActive]}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleMarkerPress(item)}
                >
                  <View style={styles.resultCardTop}>
                    <View style={styles.resultCardTitleWrap}>
                      <Text style={styles.resultCardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {!!item.category && (
                        <Text style={styles.resultCardCategory}>
                          {localizeCategory(item.category)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.rankBadge, active && styles.rankBadgeActive]}>
                      <Text style={[styles.rankText, active && styles.rankTextActive]}>
                        {restaurants.findIndex((restaurant) => restaurant.id === item.id) + 1}
                      </Text>
                    </View>
                  </View>
                  {!!item.address && (
                    <Text style={styles.resultCardAddress} numberOfLines={1}>
                      📍 {item.address}
                    </Text>
                  )}
                  {!!item.phone && (
                    <Text style={styles.resultCardPhone} numberOfLines={1}>
                      📞 {item.phone}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
  },
  regionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  regionPillKR: { backgroundColor: colors.krSoft },
  regionPillGlobal: { backgroundColor: colors.globalSoft },
  regionPillText: { fontSize: 12, fontWeight: "700" },
  regionTextKR: { color: colors.kr },
  regionTextGlobal: { color: colors.global },
  quickRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.primarySurface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  quickChipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  recentChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  recentChipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultSummary: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  clearText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  mapCard: {
    marginHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: cozyTheme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: cozyTheme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: cozyTheme.shadow.opacity,
    shadowRadius: 4,
    elevation: 2,
  },
  mapGrid: {
    height: MAP_HEIGHT,
    backgroundColor: colors.surfaceSoft,
    position: "relative",
  },
  mapLineHorizontal: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: colors.border,
  },
  mapLineVertical: {
    position: "absolute",
    top: 16,
    bottom: 16,
    width: 1,
    backgroundColor: colors.border,
  },
  marker: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerActive: {
    transform: [{ scale: 1.12 }],
  },
  markerText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  mapPreviewCard: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  mapPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mapPreviewName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: "800",
  },
  mapPreviewBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  mapPreviewBadgeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700",
  },
  mapPreviewAddress: {
    fontSize: 13,
    color: colors.textMuted,
  },
  mapPreviewButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  mapPreviewButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  resultList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: cozyTheme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  resultCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSoft,
  },
  resultCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultCardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  resultCardName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "800",
  },
  resultCardCategory: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  rankBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeActive: {
    backgroundColor: colors.primary,
  },
  rankText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "800",
  },
  rankTextActive: {
    color: colors.white,
  },
  resultCardAddress: {
    fontSize: 12,
    color: colors.textMuted,
  },
  resultCardPhone: {
    fontSize: 12,
    color: colors.textSubtle,
  },
});
