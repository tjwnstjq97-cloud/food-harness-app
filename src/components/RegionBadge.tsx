/**
 * RegionBadge — KR / GLOBAL 지역 배지 컴포넌트
 * 검색 결과, 상세 페이지, 카드에서 재사용.
 * 하네스 규칙: region 없이 지도/검색 기능 표시 금지 → 배지로 항상 명시.
 */
import { View, Text, StyleSheet } from "react-native";
import type { Region } from "../types/region";
import { cozyTheme } from "../utils/theme";

interface RegionBadgeProps {
  region: Region;
  /** 큰 배지 (상세 페이지용) */
  size?: "sm" | "md";
}

export function RegionBadge({ region, size = "sm" }: RegionBadgeProps) {
  const isKR = region === "KR";
  const label = isKR ? "🇰🇷 KR" : "🌏 GLOBAL";

  return (
    <View
      style={[
        styles.badge,
        isKR ? styles.badgeKR : styles.badgeGlobal,
        size === "md" && styles.badgeMd,
      ]}
    >
      <Text
        style={[
          styles.text,
          isKR ? styles.textKR : styles.textGlobal,
          size === "md" && styles.textMd,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/** 검색/헤더용 독립 표시 (배지 없이 텍스트만) */
export function RegionLabel({ region }: { region: Region }) {
  const isKR = region === "KR";
  return (
    <Text style={[styles.labelText, isKR ? styles.textKR : styles.textGlobal]}>
      {isKR ? "네이버 기반 검색" : "구글 기반 검색"}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeKR: { backgroundColor: cozyTheme.colors.krSoft },
  badgeGlobal: { backgroundColor: cozyTheme.colors.globalSoft },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
  textKR: { color: cozyTheme.colors.kr },
  textGlobal: { color: cozyTheme.colors.global },
  textMd: {
    fontSize: 13,
  },
  labelText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
