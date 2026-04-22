/**
 * ReviewCard — 개별 리뷰 표시 컴포넌트
 * 하네스 규칙:
 *  - source 없으면 렌더 금지
 *  - 긍정/부정 배지 색상 구분
 *  - 개인정보(authorName) 표시 최소화
 */
import { View, Text, StyleSheet } from "react-native";
import type { Review } from "../types/review";

interface ReviewCardProps {
  review: Review;
  /** 텍스트 최대 줄 수 (기본 3) */
  maxLines?: number;
}

const SENTIMENT_CONFIG = {
  positive: { icon: "👍", color: "#4CAF50", bg: "#E8F5E9", label: "긍정" },
  negative: { icon: "👎", color: "#F44336", bg: "#FFEBEE", label: "부정" },
  neutral:  { icon: "💬", color: "#9E9E9E", bg: "#F5F5F5", label: "중립" },
};

const SOURCE_LABELS: Record<string, string> = {
  naver:       "네이버",
  kakao:       "카카오",
  mangoplate:  "망고플레이트",
  google:      "구글",
  yelp:        "옐프",
  tripadvisor: "트립어드바이저",
  user:        "직접 입력",
};

export function ReviewCard({ review, maxLines = 3 }: ReviewCardProps) {
  // 하네스 규칙: source 없으면 표시 금지
  if (!review.source) return null;

  const sentiment = review.sentiment ?? "neutral";
  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  const sourceLabel = SOURCE_LABELS[review.source] ?? review.source;

  const stars = "★".repeat(Math.round(review.rating)) +
                "☆".repeat(5 - Math.round(review.rating));

  return (
    <View style={styles.card}>
      {/* 상단: 감정 배지 + 출처 + 별점 */}
      <View style={styles.header}>
        <View style={[styles.sentimentBadge, { backgroundColor: config.bg }]}>
          <Text style={styles.sentimentIcon}>{config.icon}</Text>
          <Text style={[styles.sentimentLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.source}>{sourceLabel}</Text>
          <Text style={styles.stars}>{stars}</Text>
        </View>
      </View>

      {/* 리뷰 텍스트 */}
      <Text style={styles.text} numberOfLines={maxLines}>
        {review.text}
      </Text>

      {/* 날짜 */}
      {!!review.createdAt && (
        <Text style={styles.date}>
          {new Date(review.createdAt).toLocaleDateString("ko-KR")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sentimentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sentimentIcon: { fontSize: 12 },
  sentimentLabel: { fontSize: 11, fontWeight: "600" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  source: { fontSize: 11, color: "#999" },
  stars: { fontSize: 12, color: "#FFA000", letterSpacing: 1 },
  text: { fontSize: 13, color: "#444", lineHeight: 19 },
  date: { fontSize: 11, color: "#bbb" },
});
