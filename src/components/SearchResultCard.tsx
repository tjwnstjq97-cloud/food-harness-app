import { memo, useCallback } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { HighlightText } from "./HighlightText";
import type { Restaurant } from "../types/restaurant";
import { localizeCategory } from "../utils/categoryMap";
import { cozyTheme } from "../utils/theme";

const colors = cozyTheme.colors;

export interface SearchResultCardMeta {
  averageRating?: number;
  reviewCount?: number;
  sourceCount?: number;
  reservationLabel?: string;
  waitingLabel?: string;
  signatureMenus?: string[];
  businessStatusLabel?: string;
  businessStatusTone?: "open" | "closed" | "unknown";
  distanceLabel?: string;
  confidenceLabel?: string;
}

interface SearchResultCardProps {
  restaurant: Restaurant;
  query: string;
  sourceLabel?: string;
  meta?: SearchResultCardMeta;
  onPressRestaurantId?: (restaurantId: string) => void;
  onPress?: () => void;
}

function getPositiveInteger(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export const SearchResultCard = memo(function SearchResultCard({
  restaurant,
  query,
  sourceLabel,
  meta,
  onPressRestaurantId,
  onPress,
}: SearchResultCardProps) {
  const topMenus = meta?.signatureMenus ?? [];
  const rating = meta?.averageRating ?? restaurant.rating;
  const reviewCount = getPositiveInteger(meta?.reviewCount ?? restaurant.reviewCount);
  const sourceCount = getPositiveInteger(meta?.sourceCount ?? (reviewCount > 0 ? 1 : 0));
  const businessStatusTone = meta?.businessStatusTone ?? "unknown";
  const categoryLabel = restaurant.category
    ? localizeCategory(restaurant.category)
    : "음식점";
  const summaryLine = restaurant.address
    ? `${categoryLabel} · ${restaurant.address}`
    : categoryLabel;
  const hasEvidence = reviewCount > 0 && sourceCount > 0;
  const aiSummaryLabel = hasEvidence || topMenus.length > 0 || !!meta?.waitingLabel
    ? "AI 요약 가능"
    : "근거 부족";
  const confidenceLabel =
    meta?.confidenceLabel ??
    (sourceCount >= 2 && reviewCount >= 20
      ? "신뢰도 높음"
      : sourceCount >= 1 && reviewCount >= 5
        ? "신뢰도 보통"
        : "근거 부족");
  const evidenceLabel = hasEvidence
    ? `근거 ${reviewCount}건 · 출처 ${sourceCount}종`
    : "근거 정보 없음";

  const pressable = !!onPress || !!onPressRestaurantId;
  const handlePress = useCallback(() => {
    if (onPress) return onPress();
    if (onPressRestaurantId) return onPressRestaurantId(restaurant.id);
    return;
  }, [onPress, onPressRestaurantId, restaurant.id]);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={pressable ? 0.75 : 1}
      onPress={handlePress}
      disabled={!pressable}
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityLabel={`${restaurant.name} 검색 결과`}
      accessibilityHint="상세 화면에서 출처 기반 리뷰 요약을 확인합니다."
      testID={`search-result-card-${restaurant.id}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <HighlightText
            text={restaurant.name}
            query={query}
            style={styles.restaurantName}
            numberOfLines={2}
          />
          <Text style={styles.resultSummaryLine} numberOfLines={2}>
            {summaryLine}
          </Text>
        </View>
        {pressable && (
          <FontAwesome name="angle-right" size={20} color={colors.textSubtle} />
        )}
      </View>

      <View style={styles.resultMetaRow}>
        {rating !== undefined ? (
          <Text style={styles.resultMetaText} numberOfLines={1}>
            <FontAwesome name="star" size={11} color={colors.primary} />{" "}
            {rating.toFixed(1)}
            {reviewCount > 0 ? ` (${reviewCount})` : ""}
          </Text>
        ) : (
          <Text style={styles.resultMetaMuted} numberOfLines={1}>
            평점 정보 없음
          </Text>
        )}
        {!!restaurant.phone && <Text style={styles.resultDot}>·</Text>}
        {!!restaurant.phone && (
          <Text style={styles.resultMetaMuted} numberOfLines={1}>
            전화 가능
          </Text>
        )}
        {!!meta?.distanceLabel && <Text style={styles.resultDot}>·</Text>}
        {!!meta?.distanceLabel && (
          <Text style={styles.resultMetaMuted} numberOfLines={1}>
            {meta.distanceLabel}
          </Text>
        )}
        {!!meta?.businessStatusLabel && <Text style={styles.resultDot}>·</Text>}
        {!!meta?.businessStatusLabel && (
          <Text
            style={[
              styles.resultMetaMuted,
              businessStatusTone === "open" && styles.statusOpen,
              businessStatusTone === "closed" && styles.statusClosed,
            ]}
            numberOfLines={1}
          >
            {meta.businessStatusLabel}
          </Text>
        )}
      </View>

      <View style={styles.insightRow}>
        {!!meta?.businessStatusLabel && (
          <View
            style={[
              styles.insightChip,
              businessStatusTone === "open" && styles.openChip,
              businessStatusTone === "closed" && styles.closedChip,
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                businessStatusTone === "open" && styles.openChipText,
                businessStatusTone === "closed" && styles.closedChipText,
              ]}
              numberOfLines={1}
            >
              {meta.businessStatusLabel}
            </Text>
          </View>
        )}
        <View style={[styles.insightChip, hasEvidence ? styles.aiChip : styles.lowEvidenceChip]}>
          <FontAwesome
            name={hasEvidence ? "magic" : "exclamation-circle"}
            size={11}
            color={hasEvidence ? colors.kr : colors.textSubtle}
          />
          <Text style={hasEvidence ? styles.aiChipText : styles.lowEvidenceText}>
            {aiSummaryLabel}
          </Text>
        </View>
        <View style={styles.insightChip}>
          <Text style={styles.insightChipText} numberOfLines={1}>
            {evidenceLabel}
          </Text>
        </View>
        <View style={[styles.insightChip, hasEvidence ? styles.confidenceChip : styles.lowEvidenceChip]}>
          <Text style={hasEvidence ? styles.confidenceChipText : styles.lowEvidenceText} numberOfLines={1}>
            {confidenceLabel}
          </Text>
        </View>
        {!!meta?.waitingLabel && (
          <View style={[styles.insightChip, styles.waitingChip]}>
            <Text style={styles.waitingChipText} numberOfLines={1}>
              웨이팅 {meta.waitingLabel}
            </Text>
          </View>
        )}
        {!!meta?.reservationLabel && meta.reservationLabel !== "예약 정보 없음" && (
          <View style={[styles.insightChip, styles.reservationChip]}>
            <Text style={styles.reservationChipText} numberOfLines={1}>
              {meta.reservationLabel}
            </Text>
          </View>
        )}
      </View>

      {topMenus.length > 0 && (
        <Text style={styles.menuPreview} numberOfLines={1}>
          대표 메뉴: {topMenus.join(" · ")}
        </Text>
      )}

      <Text style={styles.sourceHint} numberOfLines={1}>
        {sourceLabel ? `${sourceLabel} 검색 결과` : "검색 결과"} · 상세에서 출처 기반 리뷰 요약 확인
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E6EAF0",
    gap: 8,
    minHeight: 132,
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
    lineHeight: 21,
  },
  resultSummaryLine: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  resultMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 5,
    rowGap: 4,
    minHeight: 18,
  },
  resultMetaText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.text,
    fontWeight: "800",
  },
  resultMetaMuted: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  resultDot: { fontSize: 12, color: colors.textSubtle },
  statusOpen: { color: colors.kr, fontWeight: "800" },
  statusClosed: { color: colors.negative, fontWeight: "800" },
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
  openChip: {
    backgroundColor: "#E8F5E9",
    borderColor: "#CDEBD0",
  },
  closedChip: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FFE0E4",
  },
  lowEvidenceChip: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  aiChipText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.kr,
    fontWeight: "800",
  },
  lowEvidenceText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: "800",
  },
  insightChipText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.text,
    fontWeight: "700",
  },
  statusChipText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "800",
  },
  openChipText: { color: colors.kr },
  closedChipText: { color: colors.negative },
  confidenceChip: {
    backgroundColor: "#F0F7FF",
    borderColor: "#D8EAFE",
  },
  confidenceChipText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.global,
    fontWeight: "800",
  },
  waitingChip: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primarySurface,
  },
  waitingChipText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
  },
  reservationChip: {
    backgroundColor: colors.krSoft,
    borderColor: colors.krSoft,
  },
  reservationChipText: {
    flexShrink: 1,
    minWidth: 0,
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
});
