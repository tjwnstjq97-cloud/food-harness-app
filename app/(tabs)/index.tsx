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
import { useState, useCallback, useMemo, useEffect, useRef, type ComponentProps } from "react";
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
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRegion } from "../../src/providers/RegionProvider";
import { useSearch, formatSearchDuration } from "../../src/hooks/useSearch";
import { useDebounce } from "../../src/hooks/useDebounce";
import { useSelectedRestaurantStore } from "../../src/stores/selectedRestaurantStore";
import { useSearchHistoryStore, formatRelativeTime } from "../../src/stores/searchHistoryStore";
import { usePendingSearchStore } from "../../src/stores/pendingSearchStore";
import { SearchBar } from "../../src/components/SearchBar";
import { SearchResultCard } from "../../src/components/SearchResultCard";
import {
  ErrorView,
  EmptyView,
  SkeletonList,
  OfflineView,
  isOfflineError,
} from "../../src/components/StateViews";
import type { Restaurant } from "../../src/types/restaurant";
import { localizeCategory } from "../../src/utils/categoryMap";
import { cozyTheme } from "../../src/utils/theme";
import { useRestaurantCardMeta } from "../../src/hooks/useRestaurantCardMeta";

const SEARCH_SUGGESTIONS_KR = ["명동", "강남", "홍대", "이태원", "을지로"];
const SEARCH_SUGGESTIONS_GLOBAL = ["sushi", "pizza", "ramen", "bbq", "cafe"];
const POPULAR_SEARCHES_KR = ["성수 브런치", "을지로 와인바", "강남 혼밥", "홍대 라멘", "종로 한식"];
const POPULAR_SEARCHES_GLOBAL = ["best ramen", "brunch near me", "sushi bar", "taco", "bakery"];
const MIN_DEBOUNCE_LEN = 2;
const PAGE_SIZE = 30;
const colors = cozyTheme.colors;

type SortKey = "default" | "name" | "rating";
type ResultFilterKey = "all" | "open" | "reservation" | "waiting" | "ai";
type IconName = ComponentProps<typeof FontAwesome>["name"];
type QuickFilter = {
  label: string;
  query: string;
  icon: IconName;
};

const SORT_LABELS: Record<SortKey, string> = {
  default: "기본",
  name: "이름",
  rating: "별점",
};

const SORT_A11Y_LABELS: Record<SortKey, string> = {
  default: "기본순",
  name: "이름순",
  rating: "별점순",
};

const RESULT_FILTER_LABELS: Record<ResultFilterKey, string> = {
  all: "전체",
  open: "영업중",
  reservation: "예약",
  waiting: "웨이팅",
  ai: "AI 요약",
};

const QUICK_FILTERS_KR: QuickFilter[] = [
  { label: "카페", query: "카페", icon: "coffee" },
  { label: "한식", query: "한식", icon: "cutlery" },
  { label: "혼밥", query: "혼밥 맛집", icon: "user" },
  { label: "회식", query: "회식 맛집", icon: "users" },
  { label: "데이트", query: "데이트 맛집", icon: "heart" },
  { label: "웨이팅 적은", query: "웨이팅 적은 맛집", icon: "clock-o" },
];

const QUICK_FILTERS_GLOBAL: QuickFilter[] = [
  { label: "Cafe", query: "cafe", icon: "coffee" },
  { label: "Sushi", query: "sushi", icon: "cutlery" },
  { label: "Solo", query: "solo dining", icon: "user" },
  { label: "Group", query: "group dining", icon: "users" },
  { label: "Date", query: "date night restaurant", icon: "heart" },
  { label: "Popular", query: "popular restaurant", icon: "star" },
];

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [activeResultFilter, setActiveResultFilter] = useState<ResultFilterKey>("all");
  const [emptyQueryNotice, setEmptyQueryNotice] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const { isKR, setRegion } = useRegion();
  const router = useRouter();
  const prevSubmitted = useRef("");

  // 250ms — 한국어 IME 입력 끝맺음 직후 자연스럽게 트리거되는 임계값.
  const debouncedQuery = useDebounce(query, 250);

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
        setActiveResultFilter("all");
        setEmptyQueryNotice(false);
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
      setActiveResultFilter("all");
      setEmptyQueryNotice(false);
    }
  }, [debouncedQuery]);

  const { data, isLoading, isError, error, refetch, isFetching } = useSearch({
    query: submitted,
    enabled: !!submitted,
    limit,
  });

  const handleSearch = useCallback((q?: string) => {
    const target = (q ?? query).trim();
    if (!target) {
      setEmptyQueryNotice(true);
      setSubmitted("");
      prevSubmitted.current = "";
      return;
    }
    setEmptyQueryNotice(false);
    addQuery(target);
    prevSubmitted.current = target;
    setSubmitted(target);
    setLimit(PAGE_SIZE);
    setActiveCategory(null);
    setActiveResultFilter("all");
    if (q) setQuery(q);
  }, [query, addQuery]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      setEmptyQueryNotice(false);
    }
  }, []);

  const handleCardPress = useCallback((restaurantId: string) => {
    const restaurant = data?.restaurants.find((r) => r.id === restaurantId);
    if (restaurant) setSelected(restaurant);
    router.push(`/restaurant/${restaurantId}`);
  }, [data?.restaurants, setSelected, router]);

  const handleClearSearch = () => {
    setQuery("");
    setSubmitted("");
    setActiveCategory(null);
    setActiveResultFilter("all");
    setEmptyQueryNotice(false);
    setLimit(PAGE_SIZE);
    prevSubmitted.current = "";
  };

  const handleRegionToggle = () => {
    const next = isKR ? "GLOBAL" : "KR";
    setRegion(next);
    handleClearSearch();
  };

  const handleMapExplore = useCallback(() => {
    router.push("/map");
  }, [router]);

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
  const categoryFiltered = useMemo(() => {
    if (!data?.restaurants) return [];
    if (!activeCategory) return data.restaurants;
    return data.restaurants.filter((r) => r.category === activeCategory);
  }, [data?.restaurants, activeCategory]);

  const restaurantIds = useMemo(
    () => (data?.restaurants ?? []).map((restaurant) => restaurant.id),
    [data?.restaurants]
  );
  const { data: cardMetaMap } = useRestaurantCardMeta(restaurantIds);

  const filterCounts = useMemo(() => {
    const counts: Record<ResultFilterKey, number> = {
      all: categoryFiltered.length,
      open: 0,
      reservation: 0,
      waiting: 0,
      ai: 0,
    };
    for (const restaurant of categoryFiltered) {
      const meta = cardMetaMap?.[restaurant.id];
      const reviewCount = meta?.reviewCount || restaurant.reviewCount || 0;
      const sourceCount = meta?.sourceCount || (restaurant.reviewCount ? 1 : 0);
      if (meta?.businessStatusTone === "open") counts.open += 1;
      if (meta?.reservationLabel && meta.reservationLabel !== "예약 정보 없음") {
        counts.reservation += 1;
      }
      if (meta?.waitingLabel) counts.waiting += 1;
      if (reviewCount > 0 && sourceCount > 0) counts.ai += 1;
    }
    return counts;
  }, [categoryFiltered, cardMetaMap]);

  const resultFiltered = useMemo(() => {
    if (activeResultFilter === "all") return categoryFiltered;
    return categoryFiltered.filter((restaurant) => {
      const meta = cardMetaMap?.[restaurant.id];
      const reviewCount = meta?.reviewCount || restaurant.reviewCount || 0;
      const sourceCount = meta?.sourceCount || (restaurant.reviewCount ? 1 : 0);
      if (activeResultFilter === "open") return meta?.businessStatusTone === "open";
      if (activeResultFilter === "reservation") {
        return !!meta?.reservationLabel && meta.reservationLabel !== "예약 정보 없음";
      }
      if (activeResultFilter === "waiting") return !!meta?.waitingLabel;
      if (activeResultFilter === "ai") return reviewCount > 0 && sourceCount > 0;
      return true;
    });
  }, [activeResultFilter, categoryFiltered, cardMetaMap]);

  /**
   * 정렬 적용 (Phase F)
   *  - default: API 응답 순서 유지 (관련도/거리 등 외부 정렬 신뢰)
   *  - name: 가나다/알파벳 순 (한국어 localeCompare)
   *  - rating: cardMeta.averageRating 내림차순, 평점 없는 항목은 뒤로
   *
   * 주의: 정렬은 클라이언트에서만 수행. 서버 페이지네이션과 별개라 누적 결과 안에서만 정렬됨.
   *       (region/source 분기 변경 없음 — 표시 정렬만 조정)
   */
  const filteredRestaurants = useMemo(() => {
    if (sortKey === "default") return resultFiltered;
    const arr = [...resultFiltered];
    if (sortKey === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else if (sortKey === "rating") {
      arr.sort((a, b) => {
        const ra = cardMetaMap?.[a.id]?.averageRating ?? a.rating;
        const rb = cardMetaMap?.[b.id]?.averageRating ?? b.rating;
        // 평점 없는 항목은 뒤로 보냄
        if (ra == null && rb == null) return 0;
        if (ra == null) return 1;
        if (rb == null) return -1;
        return rb - ra;
      });
    }
    return arr;
  }, [resultFiltered, sortKey, cardMetaMap]);

  const renderItem = useCallback(({ item }: { item: Restaurant }) => {
    const cardMeta = cardMetaMap?.[item.id];
    return (
      <SearchResultCard
        restaurant={item}
        query={submitted}
        sourceLabel={data?.source}
        meta={cardMeta}
        onPressRestaurantId={handleCardPress}
      />
    );
  }, [cardMetaMap, submitted, data?.source, handleCardPress]);

  const showRecentQueries = !submitted && recentQueries.length > 0;
  const showRecentEmpty = !submitted && recentQueries.length === 0;
  const showPopularSearches = !submitted;
  const showEmptyQueryNotice = emptyQueryNotice && !submitted;
  const showResults = !isLoading && !isError && !!submitted && !!data;
  const suggestions = isKR ? SEARCH_SUGGESTIONS_KR : SEARCH_SUGGESTIONS_GLOBAL;
  const popularSearches = isKR ? POPULAR_SEARCHES_KR : POPULAR_SEARCHES_GLOBAL;
  const quickFilters = isKR ? QUICK_FILTERS_KR : QUICK_FILTERS_GLOBAL;

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
      <View style={styles.searchSurface}>
        <View style={styles.searchTopBar}>
          <View style={styles.searchTitleBlock}>
            <Text style={styles.headerTitle}>검색</Text>
            <Text style={styles.headerSubtitle}>리뷰 근거까지 빠르게 확인</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.regionBadge,
              isKR ? styles.regionBadgeKR : styles.regionBadgeGlobal,
            ]}
            onPress={handleRegionToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isKR ? "국내 검색 지역 전환" : "글로벌 검색 지역 전환"}
          >
            <Text style={[styles.regionText, isKR ? styles.regionTextKR : styles.regionTextGlobal]}>
              {isKR ? "KR" : "GLOBAL"}
            </Text>
            <FontAwesome
              name="exchange"
              size={11}
              color={isKR ? colors.kr : colors.global}
            />
          </TouchableOpacity>
        </View>

        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          onSubmit={() => handleSearch()}
          placeholder={isKR ? "식당, 메뉴, 지역 검색" : "Search restaurants"}
          disabled={false}
          size="large"
          accessibilityLabel="음식점 검색어"
          onClear={handleClearSearch}
        />

        {showEmptyQueryNotice && (
          <View style={styles.emptyQueryNotice} testID="home-empty-query-notice">
            <FontAwesome name="info-circle" size={13} color={colors.primary} />
            <Text style={styles.emptyQueryText}>
              검색어를 입력하거나 최근/인기 검색어를 선택해주세요.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.locationSelector}
          onPress={handleMapExplore}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="지역 또는 현재 위치 선택"
          testID="home-location-selector"
        >
          <View style={styles.locationTextBlock}>
            <Text style={styles.locationLabel}>검색 기준 위치</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {isKR ? "서울 성동구 주변" : "Current map area"}
            </Text>
          </View>
          <View style={styles.locationActionPill}>
            <FontAwesome name="crosshairs" size={11} color={colors.primary} />
            <Text style={styles.locationActionText}>현재 위치</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapSearchButton}
          onPress={handleMapExplore}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="지도에서 음식점 찾기"
        >
          <View style={styles.mapSearchIcon}>
            <FontAwesome name="location-arrow" size={14} color={colors.primary} />
          </View>
          <Text style={styles.mapSearchText}>지도에서 찾기</Text>
          <Text style={styles.mapSearchSub}>현재 위치/지도 기반 탐색</Text>
          <FontAwesome name="angle-right" size={16} color={colors.textSubtle} />
        </TouchableOpacity>

        <View style={styles.quickFilterSection}>
          <Text style={styles.quickFilterTitle}>빠른 필터</Text>
          <View style={styles.quickFilterGrid}>
            {quickFilters.map((filter) => (
              <TouchableOpacity
                key={filter.query}
                style={styles.quickFilterChip}
                onPress={() => handleSearch(filter.query)}
                activeOpacity={0.82}
              >
                <FontAwesome name={filter.icon} size={12} color={colors.textMuted} />
                <Text style={styles.quickFilterText} numberOfLines={1}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* 스켈레톤 로딩 */}
      {isLoading && (
        <View>
          <View style={styles.inlineStatus}>
            <Text style={styles.inlineStatusTitle}>검색 중…</Text>
            <Text style={styles.inlineStatusText}>
              결과를 불러온 뒤 출처 기반 요약 가능 여부를 표시합니다.
            </Text>
          </View>
          <SkeletonList count={4} />
        </View>
      )}

      {/* 오프라인 에러 */}
      {isError && isOfflineError(error) && (
        <OfflineView onRetry={() => refetch()} />
      )}

      {/* 일반 에러 */}
      {isError && !isOfflineError(error) && (
        <ErrorView
          message="검색에 실패했습니다. 잠시 후 다시 시도하거나 다른 키워드로 검색해보세요."
          onRetry={() => refetch()}
        />
      )}

      {/* 결과 없음 + 검색 제안 */}
      {showResults && data.restaurants.length === 0 && (
        <View style={styles.emptyWrapper}>
          <EmptyView
            title="검색 결과가 없습니다"
            subtitle="철자를 확인하거나 지역/메뉴 키워드를 바꿔보세요. 출처 없는 정보는 표시하지 않습니다."
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

      {showRecentEmpty && (
        <View style={styles.recentEmptyPanel} testID="home-recent-empty">
          <Text style={styles.recentEmptyTitle}>최근 검색어 없음</Text>
          <Text style={styles.recentEmptyText}>
            검색하면 이곳에 최근 키워드가 저장됩니다.
          </Text>
        </View>
      )}

      {/* 시작 추천 / 인기 검색어 */}
      {showPopularSearches && (
        <View style={styles.startPanel} testID="home-popular-searches">
          <View style={styles.startPanelHeader}>
            <Text style={styles.startPanelTitle}>{isKR ? "인기 검색어" : "Popular searches"}</Text>
            <Text style={styles.startPanelMeta}>mock</Text>
          </View>
          <View style={styles.suggestionRow}>
            {popularSearches.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => handleSearch(s)}
                activeOpacity={0.82}
              >
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.suggestionTitle}>{isKR ? "지역 추천" : "Try these"}</Text>
          <View style={styles.suggestionRow}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionChip}
                onPress={() => handleSearch(s)}
                activeOpacity={0.82}
              >
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 검색 결과 */}
      {showResults && data.restaurants.length > 0 && (
        <>
          <View style={styles.resultHeader}>
            <View style={styles.resultHeaderTextBlock}>
              <Text style={styles.resultCount}>
                {activeCategory
                  ? `${filteredRestaurants.length}개 · ${localizeCategory(activeCategory)}`
                  : `${data.totalCount}개 결과${durationLabel ? ` · ${durationLabel}` : ""}`}
              </Text>
              <Text style={styles.resultSourceLine} numberOfLines={1}>
                {data.source} 검색 · 출처 있는 리뷰 요약만 표시
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearSearch}>✕ 초기화</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.resultFilterList}
            style={styles.resultFilterScroll}
            testID="home-result-filter-chips"
          >
            {(Object.keys(RESULT_FILTER_LABELS) as ResultFilterKey[]).map((key) => {
              const active = activeResultFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.resultFilterChip, active && styles.resultFilterChipActive]}
                  onPress={() => setActiveResultFilter(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`home-result-filter-${key}`}
                >
                  <Text
                    style={[
                      styles.resultFilterText,
                      active && styles.resultFilterTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {RESULT_FILTER_LABELS[key]} {filterCounts[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 정렬 옵션 (컴팩트 segmented control) */}
          <View
            style={styles.sortSegment}
            accessibilityLabel="정렬 옵션"
            testID="home-sort-chips"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => {
              const active = sortKey === k;
              return (
                <TouchableOpacity
                  key={k}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                  onPress={() => setSortKey(k)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${SORT_A11Y_LABELS[k]} 정렬`}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      active && styles.sortChipTextActive,
                    ]}
                  >
                    {SORT_LABELS[k]}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
                onPress={() => {
                  setActiveCategory(null);
                  setActiveResultFilter("all");
                }}
              >
                <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>
                  전체 ({data.restaurants.length})
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                  onPress={() => {
                    setActiveCategory(activeCategory === cat ? null : cat);
                    setActiveResultFilter("all");
                  }}
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
              title="선택한 조건의 결과가 없습니다"
              subtitle="필터를 줄이거나 다른 정렬/카테고리를 선택해보세요."
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
              // 성능 튜닝 (Phase 23)
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={11}
              removeClippedSubviews
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
                  tintColor={colors.primary}
                  colors={[colors.primary]}
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
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  searchSurface: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF0",
    gap: 12,
  },
  searchTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  searchTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  regionBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  regionBadgeKR: { backgroundColor: colors.krSoft },
  regionBadgeGlobal: { backgroundColor: colors.globalSoft },
  regionText: { fontSize: 11, fontWeight: "800" },
  regionTextKR: { color: colors.kr },
  regionTextGlobal: { color: colors.global },
  mapSearchButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  mapSearchIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mapSearchText: { fontSize: 13, color: colors.text, fontWeight: "800" },
  mapSearchSub: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
  },
  quickFilterSection: { gap: 8 },
  quickFilterTitle: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: "800",
  },
  quickFilterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickFilterChip: {
    minHeight: 34,
    maxWidth: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  quickFilterText: {
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "800",
  },
  emptyQueryNotice: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primarySurface,
    backgroundColor: colors.primarySurface,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  emptyQueryText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
    lineHeight: 17,
  },
  locationSelector: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  locationTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  locationLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: "700",
  },
  locationValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "800",
  },
  locationActionPill: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primarySurface,
  },
  locationActionText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "800",
  },

  /* 최근 검색어 */
  recentSection: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF0",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentTitle: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  clearAll: { fontSize: 12, color: colors.primary },
  recentList: { paddingHorizontal: 12, gap: 8 },
  recentChipWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 36,
    paddingVertical: 4,
  },
  recentChip: { justifyContent: "center" },
  recentChipText: { fontSize: 13, color: colors.text },
  recentChipTime: { fontSize: 10, color: colors.textSubtle, marginTop: 1 },
  removeChip: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  removeChipText: { fontSize: 14, color: colors.textSubtle },
  recentEmptyPanel: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF0",
    gap: 3,
  },
  recentEmptyTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "800",
  },
  recentEmptyText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },

  /* 시작 추천 */
  startPanel: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF0",
    gap: 10,
  },
  startPanelTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "800",
  },
  startPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  startPanelMeta: {
    flexShrink: 0,
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: "700",
  },
  inlineStatus: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: colors.white,
    gap: 3,
  },
  inlineStatusTitle: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "800",
  },
  inlineStatusText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },

  /* 검색 제안 */
  emptyWrapper: { flex: 1, alignItems: "center" },
  suggestionTitle: { fontSize: 13, color: colors.textSubtle, marginTop: 4, marginBottom: 10 },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  suggestionText: { fontSize: 13, color: colors.textMuted, fontWeight: "700" },

  /* 결과 헤더 */
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  resultHeaderTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resultCount: { fontSize: 13, color: colors.text, fontWeight: "800" },
  resultSourceLine: { fontSize: 11, color: colors.textSubtle, fontWeight: "600" },
  clearSearch: { fontSize: 12, color: colors.primary, fontWeight: "800" },
  resultFilterScroll: {
    backgroundColor: "#F8FAFC",
  },
  resultFilterList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  resultFilterChip: {
    minHeight: 32,
    maxWidth: 140,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  resultFilterChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  resultFilterText: {
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "800",
  },
  resultFilterTextActive: {
    color: colors.white,
  },

  /* 카테고리 필터 칩 */
  categoryChipScroll: {
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E6EAF0",
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
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primary,
  },
  categoryChipText: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  categoryChipTextActive: { color: colors.primary, fontWeight: "700" },

  /* 정렬 세그먼트 */
  sortSegment: {
    flexDirection: "row",
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 8,
    padding: 2,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChip: {
    minWidth: 48,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  sortChipActive: {
    backgroundColor: colors.primary,
  },
  sortChipText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  sortChipTextActive: { color: "#fff", fontWeight: "800" },

  /* 결과 목록 */
  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 8, paddingTop: 6 },

  /* 더 보기 버튼 */
  loadMoreBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadMoreText: { fontSize: 14, color: colors.primary, fontWeight: "600" },

  /* 카드 */
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
    minWidth: 0,
  },
  resultSummaryLine: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  cardBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 132,
    flexShrink: 1,
  },
  cardBadgeText: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 18,
  },
  resultMetaText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "800",
  },
  resultMetaMuted: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  resultDot: { fontSize: 12, color: colors.textSubtle },
  insightRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, rowGap: 6 },
  insightChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    maxWidth: "100%",
  },
  aiChip: {
    backgroundColor: colors.krSoft,
    borderColor: colors.krSoft,
  },
  insightChipMuted: {
    backgroundColor: colors.surfaceSoft,
  },
  insightChipText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: "700",
  },
  insightChipTextMuted: {
    color: colors.textSubtle,
  },
  aiChipText: {
    fontSize: 11,
    color: colors.kr,
    fontWeight: "800",
  },
  waitingChip: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primarySurface,
  },
  waitingChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
  },
  reservationChip: {
    backgroundColor: colors.krSoft,
  },
  reservationChipText: {
    fontSize: 11,
    color: colors.kr,
    fontWeight: "700",
  },
  menuPreview: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  sourceHint: {
    fontSize: 11,
    color: colors.textSubtle,
    lineHeight: 16,
  },
  address: { fontSize: 13, color: colors.textMuted },
  phone: { fontSize: 12, color: colors.textSubtle },
  tapHint: { fontSize: 11, color: colors.textSubtle, textAlign: "right" },
});
