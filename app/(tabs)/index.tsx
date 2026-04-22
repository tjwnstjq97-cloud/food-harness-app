/**
 * 홈 탭 — 음식점 검색
 * - region 분기: KR(네이버), GLOBAL(구글)
 * - debounce 300ms 자동 검색 (2글자 이상)
 * - 카테고리 필터 칩 (개수 포함)
 * - 스켈레톤 로딩
 * - 오프라인 에러 처리
 * - 더 보기 (페이지네이션)
 * - pull-to-refresh
 * - 스크롤 시 키보드 자동 내림
 * - 검색 소요 시간 표시
 * - 최근 검색어 상대 시간 표시
 */
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useRegion } from "../../src/providers/RegionProvider";
import { useSearch, formatSearchDuration } from "../../src/hooks/useSearch";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useSelectedRestaurantStore } from "../../src/stores/selectedRestaurantStore";
import { useSearchHistoryStore, formatRelativeTime } from "../../src/stores/searchHistoryStore";
import { usePendingSearchStore } from "../../src/stores/pendingSearchStore";
import { SearchBar } from "../../src/components/SearchBar";
import { RegionLabel } from "../../src/components/RegionBadge";
import {
  ErrorView,
  EmptyView,
  SkeletonList,
  OfflineView,
  isOfflineError,
} from "../../src/components/StateViews";
import type { Restaurant } from "../../src/types/restaurant";
import { localizeCategory } from "../../src/utils/categoryMap";
import { HighlightText } from "../../src/components/HighlightText";

const SEARCH_SUGGESTIONS_KR = ["명동", "강남", "홍대", "이태원", "을지로"];
const SEARCH_SUGGESTIONS_GLOBAL = ["sushi", "pizza", "ramen", "bbq", "cafe"];
const MIN_DEBOUNCE_LEN = 2;
const PAGE_SIZE = 30;

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const { region, isKR, setRegion } = useRegion();
  const router = useRouter();
  const prevSubmitted = useRef("");

  const debouncedQuery = useDebounce(query, 300);

  const setSelected = useSelectedRestaurantStore((s) => s.setSelected);
  const { queries: recentQueries, timestamps, addQuery, removeQuery } = useSearchHistoryStore();
  const { pendingQuery, clearPendingQuery } = usePendingSearchStore();

  // 지도 탭에서 빠른 검색 버튼 탭 시 자동 검색
  useEffect(() => {
    if (pendingQuery) {
      const q = pendingQuery.trim();
      clearPendingQuery();
      if (q) {
        setQuery(q);
        prevSubmitted.current = q;
        setSubmitted(q);
        setLimit(PAGE_SIZE);
        setActiveCategory(null);
      }
    }
    // pendingQuery 변경 시에만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery]);

  // debounce: 2글자 이상이면 자동 검색
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= MIN_DEBOUNCE_LEN && trimmed !== prevSubmitted.current) {
      prevSubmitted.current = trimmed;
      setSubmitted(trimmed);
      setLimit(PAGE_SIZE);
      setActiveCategory(null);
    }
  }, [debouncedQuery]);

  const { data, isLoading, isError, error, refetch, isFetching } = useSearch({
    query: submitted,
    enabled: !!submitted,
    limit,
  });

  const handleSearch = useCallback((q?: string) => {
    const target = (q ?? query).trim();
    if (!target) return;
    addQuery(target);
    prevSubmitted.current = target;
    setSubmitted(target);
    setLimit(PAGE_SIZE);
    setActiveCategory(null);
    if (q) setQuery(q);
  }, [query, addQuery]);

  const handleCardPress = useCallback(
    (restaurant: Restaurant) => {
      setSelected(restaurant);
      router.push(`/restaurant/${restaurant.id}`);
    },
    [setSelected, router]
  );

  const handleClearSearch = () => {
    setQuery("");
    setSubmitted("");
    setActiveCategory(null);
    setLimit(PAGE_SIZE);
    prevSubmitted.current = "";
  };

  const handleRegionToggle = () => {
    const next = isKR ? "GLOBAL" : "KR";
    setRegion(next);
    handleClearSearch();
  };

  const handleRefresh = useCallback(async () => {
    if (!submitted) return;
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [submitted, refetch]);

  // 카테고리 목록 + 개수 추출 (최대 8개)
  const categoryMap = useMemo(() => {
    if (!data?.restaurants.length) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const r of data.restaurants) {
      if (r.category) {
        map.set(r.category, (map.get(r.category) ?? 0) + 1);
      }
    }
    return map;
  }, [data?.restaurants]);

  const categories = useMemo(() => [...categoryMap.keys()].slice(0, 8), [categoryMap]);

  // 카테고리 필터 적용
  const filteredRestaurants = useMemo(() => {
    if (!data?.restaurants) return [];
    if (!activeCategory) return data.restaurants;
    return data.restaurants.filter((r) => r.category === activeCategory);
  }, [data?.restaurants, activeCategory]);

  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.cardTop}>
        <HighlightText
          text={item.name}
          query={submitted}
          style={styles.restaurantName}
          numberOfLines={1}
        />
        {!!item.category && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{localizeCategory(item.category)}</Text>
          </View>
        )}
      </View>
      {!!item.address && (
        <HighlightText
          text={`📍 ${item.address}`}
          query={submitted}
          style={styles.address}
          numberOfLines={1}
        />
      )}
      {!!item.phone && (
        <Text style={styles.phone} numberOfLines={1}>
          📞 {item.phone}
        </Text>
      )}
      <Text style={styles.tapHint}>탭하여 상세보기 →</Text>
    </TouchableOpacity>
  );

  const showRecentQueries = !submitted && recentQueries.length > 0;
  const showHint = !submitted && recentQueries.length === 0;
  const showResults = !isLoading && !isError && !!submitted && !!data;
  const suggestions = isKR ? SEARCH_SUGGESTIONS_KR : SEARCH_SUGGESTIONS_GLOBAL;

  // 검색 소요 시간
  const durationLabel =
    data?.durationMs !== undefined
      ? `${formatSearchDuration(data.durationMs)}`
      : "";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>음식점 탐색</Text>
        <TouchableOpacity
          style={styles.regionBadge}
          onPress={handleRegionToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.regionText}>{isKR ? "🇰🇷 KR" : "🌏 GLOBAL"}</Text>
          <Text style={styles.regionToggleHint}>전환</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={() => handleSearch()}
        placeholder={isKR ? "식당 이름, 카테고리 검색..." : "Search restaurants..."}
        disabled={isLoading || isFetching}
      />

      {/* 스켈레톤 로딩 */}
      {isLoading && <SkeletonList count={4} />}

      {/* 오프라인 에러 */}
      {isError && isOfflineError(error) && (
        <OfflineView onRetry={() => refetch()} />
      )}

      {/* 일반 에러 */}
      {isError && !isOfflineError(error) && (
        <ErrorView
          message={error instanceof Error ? error.message : "검색에 실패했습니다."}
          onRetry={() => refetch()}
        />
      )}

      {/* 결과 없음 + 검색 제안 */}
      {showResults && data.restaurants.length === 0 && (
        <View style={styles.emptyWrapper}>
          <EmptyView
            title="검색 결과가 없습니다"
            subtitle="다른 키워드로 검색해보세요."
            icon="🔍"
          />
          <Text style={styles.suggestionTitle}>이렇게 검색해보세요</Text>
          <View style={styles.suggestionRow}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => handleSearch(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 최근 검색어 */}
      {showRecentQueries && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>최근 검색</Text>
            <TouchableOpacity
              onPress={() => useSearchHistoryStore.getState().clearAll()}
            >
              <Text style={styles.clearAll}>전체 삭제</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          >
            {recentQueries.map((q) => (
              <View key={q} style={styles.recentChipWrapper}>
                <TouchableOpacity
                  style={styles.recentChip}
                  onPress={() => handleSearch(q)}
                >
                  <Text style={styles.recentChipText}>{q}</Text>
                  {!!timestamps?.[q] && (
                    <Text style={styles.recentChipTime}>
                      {formatRelativeTime(timestamps[q])}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeChip}
                  onPress={() => removeQuery(q)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.removeChipText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 힌트 */}
      {showHint && (
        <View style={styles.hint}>
          <Text style={styles.hintIcon}>🍽️</Text>
          <RegionLabel region={region} />
          <Text style={styles.hintSub}>검색어를 입력하면 자동으로 검색됩니다</Text>
          <View style={styles.suggestionRow}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => handleSearch(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 검색 결과 */}
      {showResults && data.restaurants.length > 0 && (
        <>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>
              {activeCategory
                ? `${filteredRestaurants.length}개 · ${activeCategory}`
                : `${data.totalCount}개 · ${data.source}${durationLabel ? ` · ${durationLabel}` : ""}`}
            </Text>
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearSearch}>✕ 초기화</Text>
            </TouchableOpacity>
          </View>

          {/* 카테고리 필터 칩 (개수 포함) */}
          {categories.length >= 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChipList}
              style={styles.categoryChipScroll}
            >
              <TouchableOpacity
                style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
                onPress={() => setActiveCategory(null)}
              >
                <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>
                  전체 ({data.restaurants.length})
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                    {localizeCategory(cat)} ({categoryMap.get(cat) ?? 0})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {filteredRestaurants.length === 0 ? (
            <EmptyView
              title={`"${activeCategory}" 카테고리 결과 없음`}
              subtitle="다른 카테고리를 선택해보세요."
              icon="🔍"
            />
          ) : (
            <FlatList
              data={filteredRestaurants}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              onEndReachedThreshold={0.3}
              onEndReached={() => {
                if (data.hasMore && !activeCategory) {
                  setLimit((l) => l + PAGE_SIZE);
                }
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#FF6B35"
                  colors={["#FF6B35"]}
                />
              }
              ListFooterComponent={
                data.hasMore && !activeCategory ? (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => setLimit((l) => l + PAGE_SIZE)}
                    disabled={isFetching}
                  >
                    <Text style={styles.loadMoreText}>
                      {isFetching ? "불러오는 중..." : "더 보기 ↓"}
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  regionBadge: {
    backgroundColor: "#FFF0EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  regionText: { fontSize: 12, color: "#FF6B35", fontWeight: "600" },
  regionToggleHint: { fontSize: 10, color: "#FF6B35", opacity: 0.6 },

  /* 최근 검색어 */
  recentSection: {
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentTitle: { fontSize: 13, fontWeight: "600", color: "#555" },
  clearAll: { fontSize: 12, color: "#FF6B35" },
  recentList: { paddingHorizontal: 12, gap: 8 },
  recentChipWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 36,
    paddingVertical: 4,
  },
  recentChip: { justifyContent: "center" },
  recentChipText: { fontSize: 13, color: "#333" },
  recentChipTime: { fontSize: 10, color: "#aaa", marginTop: 1 },
  removeChip: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  removeChipText: { fontSize: 14, color: "#aaa" },

  /* 힌트 */
  hint: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  hintIcon: { fontSize: 48, marginBottom: 4 },
  hintSub: { fontSize: 13, color: "#999", marginBottom: 8 },

  /* 검색 제안 */
  emptyWrapper: { flex: 1, alignItems: "center" },
  suggestionTitle: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 4,
    marginBottom: 10,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  suggestionText: { fontSize: 13, color: "#555" },

  /* 결과 헤더 */
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: { fontSize: 12, color: "#888" },
  clearSearch: { fontSize: 12, color: "#FF6B35" },

  /* 카테고리 필터 칩 */
  categoryChipScroll: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryChipList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: "#FFF0EB",
    borderColor: "#FF6B35",
  },
  categoryChipText: { fontSize: 12, color: "#555", fontWeight: "500" },
  categoryChipTextActive: { color: "#FF6B35", fontWeight: "700" },

  /* 결과 목록 */
  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 8, paddingTop: 4 },

  /* 더 보기 버튼 */
  loadMoreBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  loadMoreText: { fontSize: 14, color: "#FF6B35", fontWeight: "600" },

  /* 카드 */
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  cardBadge: {
    backgroundColor: "#FFF0EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardBadgeText: { fontSize: 11, color: "#FF6B35", fontWeight: "600" },
  address: { fontSize: 13, color: "#777" },
  phone: { fontSize: 12, color: "#aaa" },
  tapHint: { fontSize: 11, color: "#ccc", textAlign: "right" },
});
