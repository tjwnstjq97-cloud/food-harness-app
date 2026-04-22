/**
 * RegionBadge — KR / GLOBAL 지역 배지 컴포넌트
 * 검색 결과, 상세 페이지, 카드에서 재사용.
 * 하네스 규칙: region 없이 지도/검색 기능 표시 금지 → 배지로 항상 명시.
 */
import { View, Text, StyleSheet } from "react-native";
import type { Region } from "../types/region";

interface RegionBadgeProps {
  region: Region;
  /** 큰 배지 (상세 페이지용) */
  size?: "sm" | "md";
}

export function RegionBadge({ region, size = "sm" }: RegionBadgeProps) {
  const isKR = region === "KR";
  const label = isKR ? "🇰🇷 KR" : "🌏 GLOBAL";

  return (
    <View style={[styles.badge, size === "md" && styles.badgeMd]}>
      <Text style={[styles.text, size === "md" && styles.textMd]}>
        {label}
      </Text>
    </View>
  );
}

/** 검색/헤더용 독립 표시 (배지 없이 텍스트만) */
export function RegionLabel({ region }: { region: Region }) {
  const isKR = region === "KR";
  return (
    <Text style={styles.labelText}>
      {isKR ? "네이버 기반 검색" : "구글 기반 검색"}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#FFF0EB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  text: {
    fontSize: 11,
    color: "#FF6B35",
    fontWeight: "600",
  },
  textMd: {
    fontSize: 13,
  },
  labelText: {
    fontSize: 13,
    color: "#FF6B35",
    fontWeight: "500",
  },
});
