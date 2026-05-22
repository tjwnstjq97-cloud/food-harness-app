/**
 * 로컬 검색 UX 미리보기.
 *
 * 외부 API/DB/.env 없이 하네스 fixture만으로 홈 검색, 결과 카드, 요약/근거 상태를
 * 브라우저에서 확인하기 위한 개발용 화면이다. 실제 제품 데이터로 오인하지 않도록
 * 모든 값은 source/evidence 구조를 갖춘 mock으로만 구성한다.
 */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { SearchBar } from "../../src/components/SearchBar";
import { SearchResultCard } from "../../src/components/SearchResultCard";
import { ReviewSummaryView } from "../../src/components/ReviewSummaryView";
import { EmptyView, ErrorView, SkeletonList } from "../../src/components/StateViews";
import {
  previewCardMeta,
  previewEmptyRecentQueries,
  previewInvalidWaitingSummary,
  previewInsufficientSummary,
  previewLongTextSummary,
  previewLowEvidenceSummary,
  previewNoWaitingSummary,
  previewPopularQueries,
  previewRecentQueries,
  previewRestaurants,
  previewReviewSummary,
  previewSourceLessSummary,
} from "../../src/fixtures/searchPreview";
import { cozyTheme } from "../../src/utils/theme";

const colors = cozyTheme.colors;
const MOCK_QUICK_FILTERS = Object.freeze([
  "카페",
  "한식",
  "혼밥",
  "회식",
  "데이트",
  "웨이팅 적은",
  "긴 chip 텍스트 줄바꿈 방지 테스트",
]);

const MOCK_SORT_CHIPS = Object.freeze(["기본", "이름", "별점"]);
const MOCK_RESULT_FILTERS = Object.freeze(["전체 6", "영업중 2", "예약 3", "웨이팅 2", "AI 요약 5"]);

export default function MockSearchScreen() {
  const [mockQuery, setMockQuery] = useState("성수 카페");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "검색 미리보기" }} />

      <View style={styles.previewShell}>
        <View style={styles.searchSurface}>
          <View style={styles.topBar}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>검색</Text>
              <Text style={styles.subtitle}>리뷰 근거까지 빠르게 확인</Text>
            </View>
            <View style={styles.regionPill}>
              <Text style={styles.regionText}>KR</Text>
              <FontAwesome name="exchange" size={11} color={colors.kr} />
            </View>
          </View>

          <SearchBar
            value={mockQuery}
            onChangeText={setMockQuery}
            onSubmit={() => undefined}
            placeholder="식당, 메뉴, 지역 검색"
            size="large"
            accessibilityLabel="mock 음식점 검색어"
          />

          {mockQuery.trim().length === 0 && (
            <View style={styles.emptyQueryNotice} testID="mock-empty-query-notice">
              <FontAwesome name="info-circle" size={13} color={colors.primary} />
              <Text style={styles.emptyQueryText}>
                검색어를 입력하거나 최근/인기 검색어를 선택해주세요.
              </Text>
            </View>
          )}

          <View style={styles.locationSelector} testID="mock-location-selector">
            <View style={styles.locationTextBlock}>
              <Text style={styles.locationLabel}>검색 기준 위치</Text>
              <Text style={styles.locationValue} numberOfLines={1}>서울 성동구 주변</Text>
            </View>
            <View style={styles.locationActionPill}>
              <FontAwesome name="crosshairs" size={11} color={colors.primary} />
              <Text style={styles.locationActionText}>현재 위치</Text>
            </View>
          </View>

          <View style={styles.mapAffordance}>
            <View style={styles.mapIcon}>
              <FontAwesome name="location-arrow" size={14} color={colors.primary} />
            </View>
            <Text style={styles.mapText}>지도에서 찾기</Text>
            <Text style={styles.mapSub}>현재 위치/지도 기반 탐색</Text>
            <FontAwesome name="angle-right" size={16} color={colors.textSubtle} />
          </View>

          <View style={styles.quickGrid} testID="mock-quick-filter-grid">
            {MOCK_QUICK_FILTERS.map((label) => (
              <View
                key={label}
                style={styles.quickChip}
                testID={`mock-quick-chip-${label}`}
              >
                <Text style={styles.quickText} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.searchAssistGrid}>
            <View style={styles.assistPanel} testID="mock-recent-searches">
              <Text style={styles.assistTitle}>최근 검색어 있음</Text>
              <View style={styles.assistChipRow}>
                {previewRecentQueries.map((query) => (
                  <View key={query} style={styles.assistChip}>
                    <Text style={styles.assistChipText} numberOfLines={1}>{query}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.assistPanel} testID="mock-recent-empty">
              <Text style={styles.assistTitle}>최근 검색어 없음</Text>
              <Text style={styles.assistCopy}>
                {previewEmptyRecentQueries.length === 0
                  ? "첫 검색 전에는 인기 검색어만 보여줍니다."
                  : previewEmptyRecentQueries.join(", ")}
              </Text>
            </View>

            <View style={styles.assistPanel} testID="mock-popular-searches">
              <Text style={styles.assistTitle}>인기 검색어 mock</Text>
              <View style={styles.assistChipRow}>
                {previewPopularQueries.map((query) => (
                  <View key={query} style={styles.assistChip}>
                    <Text style={styles.assistChipText} numberOfLines={1}>{query}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section} testID="mock-search-states">
          <Text style={styles.sectionTitle}>검색 상태 mock</Text>
          <Text style={styles.sectionSub}>
            인증/DB 없이 로딩, 빈 결과, 오류, 안내 상태를 모두 렌더합니다.
          </Text>
          <View style={styles.stateList}>
            <View style={styles.statePreview}>
              <Text style={styles.stateTitle}>로딩</Text>
              <SkeletonList count={2} />
            </View>
            <View style={styles.statePreview}>
              <Text style={styles.stateTitle}>빈 결과</Text>
              <EmptyView
                title="검색 결과가 없습니다"
                subtitle="조건을 줄이거나 다른 음식점/메뉴로 검색해보세요."
                icon="검색"
                fullScreen={false}
              />
            </View>
            <View style={styles.statePreview}>
              <Text style={styles.stateTitle}>오류</Text>
              <ErrorView
                message="mock 오류: 검색 소스 응답을 합치지 못했습니다."
                fullScreen={false}
              />
            </View>
            <View style={styles.statePreview}>
              <Text style={styles.stateTitle}>인증/DB 필요</Text>
              <Text style={styles.stateCopy}>
                실제 캐시 HIT와 개인화 검증은 Supabase 세션과 DB 상태 확인 승인 후 진행합니다.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section} testID="mock-search-results">
          <Text style={styles.sectionTitle}>검색 결과 mock</Text>
          <Text style={styles.sectionSub}>
            긴 이름, 근거 부족, 웨이팅 없음, 영업중/영업종료 상태를 함께 확인합니다.
          </Text>
          <View style={styles.resultToolbar}>
            <View style={styles.resultCountBlock}>
              <Text style={styles.resultCount}>6개 결과</Text>
              <Text style={styles.resultSource}>mock fixture · 출처 있는 요약만 표시</Text>
            </View>
            <Text style={styles.resetText}>초기화</Text>
          </View>
          <View style={styles.resultChipRow} testID="mock-result-filter-chips">
            {MOCK_RESULT_FILTERS.map((label, index) => (
              <View key={label} style={[styles.resultFilterChip, index === 0 && styles.resultFilterChipActive]}>
                <Text
                  style={[styles.resultFilterText, index === 0 && styles.resultFilterTextActive]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.sortChipRow} testID="mock-sort-chips">
            {MOCK_SORT_CHIPS.map((label, index) => (
              <View key={label} style={[styles.sortChip, index === 0 && styles.sortChipActive]}>
                <Text style={[styles.sortText, index === 0 && styles.sortTextActive]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.cardList}>
            {previewRestaurants.map((restaurant) => (
              <SearchResultCard
                key={restaurant.id}
                restaurant={restaurant}
                query="성수 카페"
                sourceLabel="mock fixture"
                meta={previewCardMeta[restaurant.id]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 요약 mock · 높은 신뢰도</Text>
          <View style={styles.evidenceBar}>
            <Text style={styles.evidenceText}>
              출처 {previewReviewSummary.sources.length}종 · 외부 리뷰{" "}
              {previewReviewSummary.totalReviewCount}건 근거
            </Text>
            <View style={styles.waitingChip}>
              <Text style={styles.waitingText}>웨이팅 근거 있음</Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewReviewSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 요약 mock · 웨이팅 정보 없음</Text>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewNoWaitingSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 요약 mock · 긴 텍스트/긴 chip</Text>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewLongTextSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 요약 mock · 근거 적음</Text>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewLowEvidenceSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 요약 mock · 잘못된 웨이팅 숨김</Text>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewInvalidWaitingSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근거 부족 상태</Text>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewInsufficientSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>출처 없는 요약 숨김</Text>
          <View style={styles.summaryCard}>
            <ReviewSummaryView
              summary={previewSourceLessSummary}
              isLoading={false}
              isError={false}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, paddingBottom: 32 },
  previewShell: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    gap: 14,
  },
  searchSurface: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    padding: 16,
    gap: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleBlock: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 24, color: colors.text, fontWeight: "800" },
  subtitle: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  regionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.krSoft,
  },
  regionText: { fontSize: 11, color: colors.kr, fontWeight: "800" },
  mapAffordance: {
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
  mapIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mapText: { fontSize: 13, color: colors.text, fontWeight: "800" },
  mapSub: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    minHeight: 34,
    maxWidth: "100%",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E6EAF0",
    justifyContent: "center",
  },
  quickText: {
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
  locationTextBlock: { flex: 1, minWidth: 0, gap: 2 },
  locationLabel: { fontSize: 11, color: colors.textSubtle, fontWeight: "700" },
  locationValue: { fontSize: 13, color: colors.text, fontWeight: "800" },
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
  locationActionText: { fontSize: 11, color: colors.primary, fontWeight: "800" },
  searchAssistGrid: {
    gap: 8,
  },
  assistPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: "#F8FAFC",
    padding: 11,
    gap: 8,
  },
  assistTitle: { fontSize: 12, color: colors.text, fontWeight: "800" },
  assistCopy: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  assistChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  assistChip: {
    maxWidth: "100%",
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  assistChipText: {
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    padding: 14,
    gap: 9,
  },
  sectionTitle: { fontSize: 15, color: colors.text, fontWeight: "800" },
  sectionSub: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  cardList: { gap: 8 },
  resultToolbar: {
    minHeight: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  resultCountBlock: { flex: 1, minWidth: 0, gap: 2 },
  resultCount: { fontSize: 13, color: colors.text, fontWeight: "800" },
  resultSource: { fontSize: 11, color: colors.textSubtle, fontWeight: "600" },
  resetText: { flexShrink: 0, fontSize: 12, color: colors.primary, fontWeight: "800" },
  resultChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  resultFilterChip: {
    maxWidth: "100%",
    minHeight: 31,
    justifyContent: "center",
    paddingHorizontal: 10,
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
  resultFilterTextActive: { color: colors.white },
  sortChipRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
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
  },
  sortChipActive: { backgroundColor: colors.primary },
  sortText: { fontSize: 11, color: colors.textMuted, fontWeight: "700" },
  sortTextActive: { color: colors.white, fontWeight: "800" },
  stateList: { gap: 9 },
  statePreview: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 8,
  },
  stateTitle: { fontSize: 12, color: colors.text, fontWeight: "800" },
  stateCopy: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    fontWeight: "600",
  },
  evidenceBar: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  evidenceText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "700",
  },
  waitingChip: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primarySurface,
  },
  waitingText: { fontSize: 11, color: colors.primary, fontWeight: "800" },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
});
