/**
 * 음식점 상세 페이지
 *
 * 데이터 우선순위:
 *  1. selectedRestaurantStore (검색 결과에서 탭한 경우 — 전체 데이터)
 *  2. useRestaurantById DB 조회 (즐겨찾기/히스토리에서 탭 — 부분 데이터 보완)
 *  3. 둘 다 없으면 fallback UI
 *
 * 기능:
 *  - restaurant 기본 정보 (이름, 카테고리, 주소, 전화, region)
 *  - Favorites 토글 버튼
 *  - 지도 열기 (region 분기: KR→Naver, GLOBAL→Google)
 *  - 진입 시 History 자동 기록
 *  - 대표 메뉴 (MenuSection) / 리뷰 요약 + 카드 (ReviewCard) / 예약 / 웨이팅
 *
 * 하네스 규칙: region 없는 지도 기능 호출 금지.
 */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSelectedRestaurantStore } from "../../src/stores/selectedRestaurantStore";
import { useRestaurantById } from "../../src/hooks/useRestaurantById";
import { useFavorites } from "../../src/hooks/useFavorites";
import { useHistory } from "../../src/hooks/useHistory";
import { useReviews } from "../../src/hooks/useReviews";
import { useReservation } from "../../src/hooks/useReservation";
import { useWaiting } from "../../src/hooks/useWaiting";
import { useSignatureMenus } from "../../src/hooks/useMenus";
import { openRestaurantMap } from "../../src/utils/mapLink";
import { RegionBadge } from "../../src/components/RegionBadge";
import { LoadingView, Toast, useToast } from "../../src/components/StateViews";
import { MenuSection } from "../../src/components/MenuSection";
import { ReviewCard } from "../../src/components/ReviewCard";
import { localizeCategory } from "../../src/utils/categoryMap";

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // ── 데이터 소스 1: Zustand store (검색 결과에서 탭)
  const storeRestaurant = useSelectedRestaurantStore((s) => s.selected);
  const storeMatchesId = storeRestaurant?.id === id;

  // ── 데이터 소스 2: DB 조회 (즐겨찾기/히스토리에서 탭, 또는 store 미스매치)
  const { data: dbRestaurant, isLoading: dbLoading } = useRestaurantById(
    id ?? "",
    storeMatchesId // store에 이미 있으면 DB 호출 스킵
  );

  // 최종 사용 restaurant: store 우선, DB 보완
  const restaurant = storeMatchesId ? storeRestaurant : (dbRestaurant ?? null);
  const isLoading = !storeMatchesId && dbLoading;

  const [reviewExpanded, setReviewExpanded] = useState(false);
  const { toast, showToast } = useToast();

  // ── 도메인 훅 (restaurant ID 기반 병렬 조회)
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const { addVisit } = useHistory();
  const { data: reviewData, isLoading: reviewLoading } = useReviews(id ?? "");
  const { data: reservationData, isLoading: reservationLoading } = useReservation(id ?? "");
  const { data: waitingData, isLoading: waitingLoading } = useWaiting(id ?? "");
  const { signatures: signatureMenus, isLoading: menuLoading } = useSignatureMenus(id ?? "");

  // ── 진입 시 History 자동 기록 (TASK 5)
  useEffect(() => {
    if (!restaurant) return;
    addVisit.mutate({
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      restaurant_region: restaurant.region,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  // ── 로딩 중
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "음식점 상세" }} />
        <LoadingView message="음식점 정보 불러오는 중..." />
      </>
    );
  }

  // ── restaurant 없음 fallback
  if (!restaurant) {
    return (
      <View style={styles.notFoundContainer}>
        <Stack.Screen options={{ title: "음식점 정보" }} />
        <Text style={styles.notFoundIcon}>🍽️</Text>
        <Text style={styles.notFoundTitle}>정보를 불러올 수 없습니다</Text>
        <Text style={styles.notFoundSub}>
          검색 화면으로 돌아가서 다시 선택해주세요.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favorited = isFavorite(restaurant.id);

  const handleFavoriteToggle = () => {
    const wasFavorited = isFavorite(restaurant.id);
    toggleFavorite({
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      restaurant_region: restaurant.region,
    });
    showToast(wasFavorited ? "즐겨찾기에서 제거됐습니다" : "즐겨찾기에 추가됐습니다 ♥");
  };

  const handleMapOpen = async () => {
    try {
      await openRestaurantMap(restaurant);
    } catch {
      Alert.alert("지도 열기 실패", "지도 앱을 열 수 없습니다.");
    }
  };

  const handlePhoneCall = () => {
    if (!restaurant.phone) return;
    Linking.openURL(`tel:${restaurant.phone}`).catch(() =>
      Alert.alert("오류", "전화 앱을 열 수 없습니다.")
    );
  };

  const handleReservationLink = () => {
    const link = reservationData?.reservation?.link;
    if (!link) return;
    Linking.openURL(link).catch(() =>
      Alert.alert("오류", "예약 페이지를 열 수 없습니다.")
    );
  };

  const handleShare = async () => {
    try {
      const mapUrl =
        restaurant.region === "KR"
          ? `https://map.naver.com/v5/search/${encodeURIComponent(restaurant.name)}`
          : `https://maps.google.com/maps/search/${encodeURIComponent(restaurant.name)}`;
      await Share.share({
        title: restaurant.name,
        message: `${restaurant.name}\n${restaurant.address ? restaurant.address + "\n" : ""}${mapUrl}`,
      });
    } catch {
      // 공유 취소 등 무시
    }
  };

  const handleReservationPhone = () => {
    const phone = reservationData?.reservation?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("오류", "전화 앱을 열 수 없습니다.")
    );
  };

  return (
    <View style={styles.wrapper}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: restaurant.name,
          headerBackTitle: "뒤로",
          headerTintColor: "#FF6B35",
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.shareHeaderBtn}>공유</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* ── 헤더 카드 ── */}
      <View
        style={[
          styles.headerCard,
          {
            borderTopWidth: 4,
            borderTopColor: restaurant.region === "KR" ? "#03C75A" : "#4285F4",
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <View style={styles.badges}>
              {!!restaurant.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{localizeCategory(restaurant.category)}</Text>
                </View>
              )}
              <RegionBadge region={restaurant.region} size="sm" />
            </View>
          </View>

          {/* 즐겨찾기 버튼 */}
          <TouchableOpacity
            style={[styles.favButton, favorited && styles.favButtonActive]}
            onPress={handleFavoriteToggle}
            disabled={isToggling}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <Text style={styles.favIcon}>{favorited ? "♥" : "♡"}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 주소 (탭하면 공유, 길게 누르면 복사 안내) */}
        {!!restaurant.address && (
          <TouchableOpacity
            style={styles.infoRow}
            onPress={async () => {
              try {
                await Share.share({ message: restaurant.address ?? "" });
                showToast("주소를 공유했습니다", "info");
              } catch {
                // 사용자 취소 등 무시
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{restaurant.address}</Text>
            <Text style={styles.copyHint}>공유</Text>
          </TouchableOpacity>
        )}

        {/* 전화 */}
        {!!restaurant.phone && (
          <TouchableOpacity style={styles.infoRow} onPress={handlePhoneCall}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={[styles.infoText, styles.phoneText]}>
              {restaurant.phone}
            </Text>
          </TouchableOpacity>
        )}

        {/* 지도 버튼 (region 별 컬러) */}
        <TouchableOpacity
          style={[
            styles.mapButton,
            { backgroundColor: restaurant.region === "KR" ? "#03C75A" : "#4285F4" },
          ]}
          onPress={handleMapOpen}
        >
          <Text style={styles.mapButtonText}>
            {restaurant.region === "KR"
              ? "🗺️  네이버 지도로 보기"
              : "🗺️  구글 지도로 보기"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 대표 메뉴 ── */}
      <MenuSection
        items={signatureMenus}
        isLoading={menuLoading}
        title="대표 메뉴"
      />

      {/* ── 예약 정보 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>예약</Text>
        <View style={styles.infoCard}>
          {reservationLoading ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <>
              {/* 상태 행: 아이콘 + 라벨 + 현장 방문 배지 */}
              <View style={styles.reservationRow}>
                <Text style={styles.reservationIcon}>
                  {reservationData?.reservation?.status === "available_online"  ? "🌐"
                   : reservationData?.reservation?.status === "available_phone" ? "📞"
                   : reservationData?.reservation?.status === "walk_in_only"    ? "🚶"
                   : reservationData?.reservation?.status === "unavailable"     ? "✕"
                   : "❓"}
                </Text>
                <Text style={styles.statusLabel}>
                  {reservationData?.statusLabel ?? "예약 정보 없음"}
                </Text>
                {reservationData?.walkInAvailable && (
                  <View style={styles.walkInBadge}>
                    <Text style={styles.walkInText}>현장 방문 가능</Text>
                  </View>
                )}
              </View>

              {/* 메모 */}
              {!!reservationData?.reservation?.note && (
                <Text style={styles.reservationNote}>
                  💬 {reservationData.reservation.note}
                </Text>
              )}

              {/* 온라인 예약 링크 버튼 */}
              {reservationData?.hasLink && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleReservationLink}
                >
                  <Text style={styles.linkButtonText}>예약 페이지 열기 →</Text>
                </TouchableOpacity>
              )}

              {/* 전화 예약 버튼 */}
              {reservationData?.reservation?.status === "available_phone" &&
                !!reservationData.reservation.phone && (
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={handleReservationPhone}
                >
                  <Text style={styles.phoneButtonText}>
                    📞 {reservationData.reservation.phone}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* ── 웨이팅 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>웨이팅</Text>
        <View style={styles.infoCard}>
          {waitingLoading ? (
            <ActivityIndicator size="small" color="#FF6B35" />
          ) : (
            <>
              {/* 대기 시간 + 추정 배지 */}
              <View style={styles.waitingRow}>
                <Text style={styles.waitingText}>
                  {waitingData?.displayText ?? "정보 없음"}
                </Text>
                {waitingData?.isEstimated && (
                  <View style={styles.estimatedBadge}>
                    <Text style={styles.estimatedText}>추정</Text>
                  </View>
                )}
              </View>

              {/* 범위 표시 (추정치가 있을 때) */}
              {waitingData?.waiting?.estimatedRange && (
                <Text style={styles.waitingRange}>
                  약 {waitingData.waiting.estimatedRange.min}~{waitingData.waiting.estimatedRange.max}분 예상
                </Text>
              )}

              {/* 근거 */}
              {!!waitingData?.waiting?.evidence && (
                <Text style={styles.waitingEvidence}>
                  📌 {waitingData.waiting.evidence}
                </Text>
              )}

              {/* 업데이트 시간 */}
              {!!waitingData?.waiting?.updatedAt && (
                <Text style={styles.waitingUpdatedAt}>
                  업데이트: {new Date(waitingData.waiting.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* ── 외부 검색 링크 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>외부에서 더 보기</Text>
        <View style={styles.externalLinks}>
          <TouchableOpacity
            style={styles.externalBtn}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + " 후기")}`
              ).catch(() => Alert.alert("오류", "링크를 열 수 없습니다."))
            }
          >
            <Text style={styles.externalBtnIcon}>🔍</Text>
            <Text style={styles.externalBtnText}>구글</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.externalBtn}
            onPress={() =>
              Linking.openURL(
                `https://www.instagram.com/explore/tags/${encodeURIComponent(
                  restaurant.name.replace(/\s+/g, "")
                )}/`
              ).catch(() => Alert.alert("오류", "링크를 열 수 없습니다."))
            }
          >
            <Text style={styles.externalBtnIcon}>📷</Text>
            <Text style={styles.externalBtnText}>인스타</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.externalBtn}
            onPress={() =>
              Linking.openURL(
                `https://www.youtube.com/results?search_query=${encodeURIComponent(restaurant.name + " 먹방")}`
              ).catch(() => Alert.alert("오류", "링크를 열 수 없습니다."))
            }
          >
            <Text style={styles.externalBtnIcon}>▶️</Text>
            <Text style={styles.externalBtnText}>유튜브</Text>
          </TouchableOpacity>
          {restaurant.region === "KR" && (
            <TouchableOpacity
              style={styles.externalBtn}
              onPress={() =>
                Linking.openURL(
                  `https://search.naver.com/search.naver?query=${encodeURIComponent(restaurant.name + " 후기")}`
                ).catch(() => Alert.alert("오류", "링크를 열 수 없습니다."))
              }
            >
              <Text style={styles.externalBtnIcon}>🟢</Text>
              <Text style={styles.externalBtnText}>네이버</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.externalNote}>
          * 외부 사이트로 이동합니다.
        </Text>
      </View>

      {/* ── 리뷰 요약 + 카드 ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>리뷰</Text>
        {reviewLoading ? (
          <View style={styles.infoCard}>
            <ActivityIndicator size="small" color="#FF6B35" />
          </View>
        ) : reviewData && reviewData.totalCount > 0 ? (
          <>
            {/* 요약 통계 */}
            <View style={styles.infoCard}>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingScore}>
                  ⭐ {reviewData.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>
                  ({reviewData.totalCount}개 리뷰)
                </Text>
              </View>
              <View style={styles.sentimentRow}>
                <View style={styles.sentimentItem}>
                  <Text>👍</Text>
                  <Text style={styles.sentimentCount}>
                    {reviewData.positiveCount}
                  </Text>
                </View>
                <View style={styles.sentimentItem}>
                  <Text>👎</Text>
                  <Text style={styles.sentimentCount}>
                    {reviewData.negativeCount}
                  </Text>
                </View>
                <View style={styles.sentimentItem}>
                  <Text>💬</Text>
                  <Text style={styles.sentimentCount}>
                    {reviewData.neutralCount}
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewNote}>
                * 출처 있는 리뷰만 표시됩니다.
              </Text>
              {reviewData.highlights.length > 0 && (
                <View style={styles.highlightSection}>
                  {reviewData.highlights.some((h) => h.sentiment === "positive") && (
                    <View style={styles.highlightGroup}>
                      <Text style={styles.highlightTitle}>장점</Text>
                      <View style={styles.highlightChips}>
                        {reviewData.highlights
                          .filter((h) => h.sentiment === "positive")
                          .map((highlight) => (
                            <View
                              key={`positive-${highlight.keyword}`}
                              style={[styles.highlightChip, styles.positiveHighlightChip]}
                            >
                              <Text style={styles.positiveHighlightText}>
                                {highlight.keyword}
                                {highlight.count > 1 ? ` ${highlight.count}` : ""}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}
                  {reviewData.highlights.some((h) => h.sentiment === "negative") && (
                    <View style={styles.highlightGroup}>
                      <Text style={styles.highlightTitle}>아쉬운 점</Text>
                      <View style={styles.highlightChips}>
                        {reviewData.highlights
                          .filter((h) => h.sentiment === "negative")
                          .map((highlight) => (
                            <View
                              key={`negative-${highlight.keyword}`}
                              style={[styles.highlightChip, styles.negativeHighlightChip]}
                            >
                              <Text style={styles.negativeHighlightText}>
                                {highlight.keyword}
                                {highlight.count > 1 ? ` ${highlight.count}` : ""}
                              </Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 긍정 리뷰 카드 */}
            {(reviewExpanded
              ? reviewData.positiveReviews
              : reviewData.positiveReviews.slice(0, 2)
            ).map((review) => (
              <View key={review.id} style={styles.reviewCardWrapper}>
                <ReviewCard review={review} maxLines={reviewExpanded ? undefined : 4} />
              </View>
            ))}

            {/* 부정 리뷰 카드 */}
            {(reviewExpanded
              ? reviewData.negativeReviews
              : reviewData.negativeReviews.slice(0, 1)
            ).map((review) => (
              <View key={review.id} style={styles.reviewCardWrapper}>
                <ReviewCard review={review} maxLines={reviewExpanded ? undefined : 4} />
              </View>
            ))}

            {/* 중립 리뷰 (전체 보기 시에만) */}
            {reviewExpanded &&
              reviewData.neutralReviews?.map((review) => (
                <View key={review.id} style={styles.reviewCardWrapper}>
                  <ReviewCard review={review} />
                </View>
              ))}

            {/* 전체 보기 / 접기 버튼 */}
            {reviewData.totalCount > 3 && (
              <TouchableOpacity
                style={styles.expandReviewBtn}
                onPress={() => setReviewExpanded((v) => !v)}
              >
                <Text style={styles.expandReviewText}>
                  {reviewExpanded
                    ? "▲ 접기"
                    : `▼ 전체 리뷰 보기 (${reviewData.totalCount}개)`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={[styles.infoCard, styles.emptyCard]}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.noDataText}>아직 수집된 리뷰가 없습니다.</Text>
            <Text style={styles.noDataSub}>출처가 확인된 리뷰만 표시됩니다.</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
    <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { paddingBottom: 32 },

  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 24,
  },
  notFoundIcon: { fontSize: 56 },
  notFoundTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  notFoundSub: { fontSize: 13, color: "#999", textAlign: "center" },
  backButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
  },
  backButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  headerCard: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitles: { flex: 1, gap: 6 },
  restaurantName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a1a",
    flexShrink: 1,
  },
  badges: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  categoryBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: { fontSize: 11, color: "#555" },

  favButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  favButtonActive: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF0EB",
  },
  favIcon: { fontSize: 20, color: "#FF6B35" },

  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoText: { flex: 1, fontSize: 14, color: "#555", lineHeight: 20 },
  phoneText: { color: "#FF6B35", textDecorationLine: "underline" },
  copyHint: {
    fontSize: 11,
    color: "#FF6B35",
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FFF0EB",
    borderRadius: 6,
  },

  mapButton: {
    marginTop: 4,
    paddingVertical: 11,
    backgroundColor: "#03C75A",
    borderRadius: 10,
    alignItems: "center",
  },
  mapButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  section: { marginHorizontal: 12, marginBottom: 4 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },

  // ── 예약 ──
  reservationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  reservationIcon: { fontSize: 16 },
  statusLabel: { fontSize: 14, color: "#333", fontWeight: "500", flex: 1 },
  walkInBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  walkInText: { fontSize: 11, color: "#2E7D32" },
  reservationNote: { fontSize: 12, color: "#888", lineHeight: 18 },
  linkButton: {
    paddingVertical: 10,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    alignItems: "center",
  },
  linkButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  phoneButton: {
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  phoneButtonText: { fontSize: 13, color: "#333", fontWeight: "500" },

  // ── 웨이팅 ──
  waitingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  waitingText: { fontSize: 16, color: "#333", fontWeight: "600" },
  estimatedBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  estimatedText: { fontSize: 11, color: "#E65100", fontWeight: "600" },
  waitingRange: { fontSize: 13, color: "#666" },
  waitingEvidence: { fontSize: 12, color: "#888", lineHeight: 18 },
  waitingUpdatedAt: { fontSize: 11, color: "#bbb", marginTop: 2 },

  // ── 리뷰 ──
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingScore: { fontSize: 20, fontWeight: "bold", color: "#1a1a1a" },
  ratingCount: { fontSize: 13, color: "#888" },
  sentimentRow: { flexDirection: "row", gap: 20 },
  sentimentItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  sentimentCount: { fontSize: 14, color: "#555" },
  reviewNote: { fontSize: 11, color: "#aaa" },
  highlightSection: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    gap: 10,
  },
  highlightGroup: { gap: 6 },
  highlightTitle: { fontSize: 12, color: "#777", fontWeight: "700" },
  highlightChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  highlightChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  positiveHighlightChip: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  negativeHighlightChip: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  positiveHighlightText: {
    fontSize: 12,
    color: "#2E7D32",
    fontWeight: "700",
  },
  negativeHighlightText: {
    fontSize: 12,
    color: "#C62828",
    fontWeight: "700",
  },
  emptyCard: { alignItems: "center", paddingVertical: 20, gap: 6 },
  emptyIcon: { fontSize: 32 },
  noDataText: { fontSize: 14, color: "#999", fontWeight: "500" },
  noDataSub: { fontSize: 12, color: "#ccc" },
  reviewCardWrapper: { marginTop: 6 },
  expandReviewBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  expandReviewText: { fontSize: 13, color: "#FF6B35", fontWeight: "600" },

  externalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  externalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  externalBtnIcon: { fontSize: 14 },
  externalBtnText: { fontSize: 13, color: "#333", fontWeight: "600" },
  externalNote: { fontSize: 11, color: "#aaa", marginTop: 6 },

  shareHeaderBtn: {
    fontSize: 15,
    color: "#FF6B35",
    fontWeight: "600",
    paddingRight: 4,
  },
  bottomPad: { height: 24 },
});
