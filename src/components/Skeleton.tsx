/**
 * Skeleton — 콘텐츠 로딩 자리표시자 (Phase D)
 *
 * 동작:
 *  - 단순 placeholder 박스 (StyleSheet 기반)
 *  - 무한 fade animation으로 "로딩 중" 시각 신호
 *  - prefers-reduced-motion 등 a11y 고려: animation은 중요 정보 아님 → 그대로 둠
 *
 * 사용:
 *  <SkeletonBox width="60%" height={20} />
 *  <RestaurantDetailSkeleton /> — 음식점 상세 페이지 전용
 */
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { cozyTheme } from "../utils/theme";

const colors = cozyTheme.colors;

interface BoxProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonBox({
  width = "100%",
  height = 14,
  borderRadius = 6,
  style,
}: BoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/**
 * 음식점 상세 페이지 전용 스켈레톤.
 * 실제 레이아웃과 비슷한 시각적 형태를 미리 보여주어 인지적 깜빡임 감소.
 */
export function RestaurantDetailSkeleton() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="음식점 정보 불러오는 중"
      accessibilityRole="progressbar"
    >
      {/* hero block */}
      <View style={styles.hero}>
        <SkeletonBox width="70%" height={26} borderRadius={8} />
        <SkeletonBox width="40%" height={14} style={{ marginTop: 10 }} />
        <View style={styles.row}>
          <SkeletonBox width={56} height={22} borderRadius={11} />
          <SkeletonBox width={80} height={22} borderRadius={11} />
        </View>
      </View>

      {/* action row */}
      <View style={styles.actionRow}>
        <SkeletonBox width="48%" height={44} borderRadius={10} />
        <SkeletonBox width="48%" height={44} borderRadius={10} />
      </View>

      {/* summary cards */}
      <View style={styles.summaryRow}>
        <SkeletonBox width="31%" height={68} borderRadius={10} />
        <SkeletonBox width="31%" height={68} borderRadius={10} />
        <SkeletonBox width="31%" height={68} borderRadius={10} />
      </View>

      {/* sections */}
      {[0, 1].map((i) => (
        <View key={i} style={styles.section}>
          <SkeletonBox width="35%" height={16} />
          <SkeletonBox width="100%" height={12} style={{ marginTop: 12 }} />
          <SkeletonBox width="92%" height={12} style={{ marginTop: 6 }} />
          <SkeletonBox width="78%" height={12} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceMuted },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 14,
  },
  hero: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: cozyTheme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: cozyTheme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
