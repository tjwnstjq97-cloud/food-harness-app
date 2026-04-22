/**
 * 공통 상태 뷰 컴포넌트
 * Loading / Error / Empty / NotFound / Skeleton / Offline 상태를 통일된 UI로 표시.
 * 검색 / 상세 / favorites / history 전 화면에서 사용.
 */
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}
export function LoadingView({
  message = "로딩 중...",
  fullScreen = true,
}: LoadingProps) {
  return (
    <View style={[styles.center, fullScreen && styles.flex]}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface ErrorProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}
export function ErrorView({
  message = "오류가 발생했습니다.",
  onRetry,
  fullScreen = true,
}: ErrorProps) {
  return (
    <View style={[styles.center, fullScreen && styles.flex]}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface EmptyProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  fullScreen?: boolean;
  /** CTA 버튼 라벨 (있으면 표시) */
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyView({
  title = "내용이 없습니다.",
  subtitle,
  icon = "🍽️",
  fullScreen = true,
  actionLabel,
  onAction,
}: EmptyProps) {
  return (
    <View style={[styles.center, fullScreen && styles.flex]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.ctaButton} onPress={onAction}>
          <Text style={styles.ctaText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** 인라인 정보 없음 표시 (카드 내부 등) */
export function NoDataView({ message = "정보 없음" }: { message?: string }) {
  return (
    <View style={styles.inline}>
      <Text style={styles.noDataText}>{message}</Text>
    </View>
  );
}

/** 오프라인 / 네트워크 오류 전용 뷰 */
interface OfflineProps {
  onRetry?: () => void;
}
export function OfflineView({ onRetry }: OfflineProps) {
  return (
    <View style={[styles.center, styles.flex]}>
      <Text style={styles.offlineIcon}>📡</Text>
      <Text style={styles.offlineTitle}>인터넷 연결을 확인해주세요</Text>
      <Text style={styles.offlineSub}>네트워크에 연결된 후 다시 시도하세요.</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** 로딩 스켈레톤 카드 — 카드 목록 로딩 중 shimmer 효과 */
function SkeletonLine({ width, height = 12 }: { width: number | string; height?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        { width: width as number, height, opacity },
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonTop}>
        <SkeletonLine width="60%" height={14} />
        <SkeletonLine width={50} height={20} />
      </View>
      <SkeletonLine width="40%" height={11} />
      <SkeletonLine width="80%" height={11} />
    </View>
  );
}

/** 스켈레톤 카드 N개 나열 */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/**
 * Toast 컴포넌트 — 화면 하단 알림 메시지 (2초 후 자동 사라짐)
 * 즐겨찾기 추가/제거, 복사 완료 등 가벼운 피드백에 사용.
 */
interface ToastProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
}
export function Toast({ visible, message, type = "success" }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1600),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, opacity]);

  if (!visible) return null;

  const bg =
    type === "error" ? "#e53e3e" : type === "info" ? "#3182ce" : "#38a169";

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

/** Toast 표시 상태 관리 훅 */
interface ToastState {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info";
}
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2100);
  };

  return { toast, showToast };
}

/** 에러 메시지가 오프라인 오류인지 판별 */
export function isOfflineError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("연결") ||
      msg.includes("timeout")
    );
  }
  return false;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 10,
  },
  message: { color: "#888", fontSize: 14, marginTop: 8 },
  errorIcon: { fontSize: 36 },
  errorText: { color: "#e53e3e", fontSize: 14, textAlign: "center" },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, color: "#555", fontWeight: "500" },
  emptySubtitle: { fontSize: 13, color: "#999", textAlign: "center" },
  ctaButton: {
    marginTop: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  inline: { paddingVertical: 8 },
  noDataText: { fontSize: 13, color: "#aaa" },

  // Offline
  offlineIcon: { fontSize: 40 },
  offlineTitle: { fontSize: 16, color: "#333", fontWeight: "600" },
  offlineSub: { fontSize: 13, color: "#999", textAlign: "center" },

  // Skeleton
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonLine: {
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
  },
  skeletonList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },

  // Toast
  toast: {
    position: "absolute",
    bottom: 90,
    left: 24,
    right: 24,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
