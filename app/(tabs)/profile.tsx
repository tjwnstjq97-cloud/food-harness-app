/**
 * 프로필 탭
 * - 사용자 정보, 방문 히스토리, 로그아웃
 * - user_id 기반 소유권 분리
 * - 통계 카드 (방문 수 · 즐겨찾기 수)
 * - Pull-to-refresh
 * - 날짜별 SectionList 그룹핑
 * - 방문 횟수 배지 (2회 이상)
 * - 전체 삭제 버튼
 */
import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { useAuthActions } from "../../src/hooks/useAuth";
import { useHistory } from "../../src/hooks/useHistory";
import { useFavorites } from "../../src/hooks/useFavorites";
import { useSelectedRestaurantStore } from "../../src/stores/selectedRestaurantStore";
import { RestaurantCard } from "../../src/components/RestaurantCard";
import { LoadingView, ErrorView, EmptyView } from "../../src/components/StateViews";
import { SettingsModal } from "../../src/components/SettingsModal";
import type { HistoryRow } from "../../src/types/restaurant";
import type { Restaurant } from "../../src/types/restaurant";

export default function ProfileScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const setSelected = useSelectedRestaurantStore((s) => s.setSelected);

  const {
    data: history,
    isLoading: historyLoading,
    isError,
    error,
    refetch,
    clearHistory,
    visitCounts,
  } = useHistory();

  const { data: favorites } = useFavorites();
  const [signingOut, setSigningOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 히스토리를 날짜 기준으로 그룹핑
  const historySections = useMemo(() => {
    if (!history || history.length === 0) return [];
    const groups = new Map<string, HistoryRow[]>();
    for (const row of history) {
      const dateKey = row.visited_at
        ? new Date(row.visited_at).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "날짜 미상";
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(row);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [history]);

  // 히스토리 카드 탭 → 상세 페이지 이동
  const handleCardPress = useCallback(
    (item: HistoryRow) => {
      const partial: Restaurant = {
        id: item.restaurant_id,
        name: item.restaurant_name,
        region: item.restaurant_region,
        category: "",
        address: "",
        latitude: 0,
        longitude: 0,
      };
      setSelected(partial);
      router.push(`/restaurant/${item.restaurant_id}`);
    },
    [setSelected, router]
  );

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      "방문 기록 전체 삭제",
      "모든 방문 기록을 삭제할까요? 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "전체 삭제",
          style: "destructive",
          onPress: () => clearHistory.mutate(),
        },
      ]
    );
  }, [clearHistory]);

  if (authLoading) return <LoadingView message="불러오는 중..." />;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EmptyView
          title="로그인이 필요합니다"
          subtitle="프로필과 방문 기록을 보려면 로그인해주세요."
        />
      </View>
    );
  }

  const handleSignOut = () => {
    Alert.alert("로그아웃", "로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch {
            Alert.alert("오류", "로그아웃 중 오류가 발생했습니다.");
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("ko-KR")
    : "-";

  const historyCount = history?.length ?? 0;
  const favCount = favorites?.length ?? 0;
  // 방문한 고유 식당 수
  const uniqueVisitedCount = Object.keys(visitCounts).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
        <TouchableOpacity
          onPress={() => setSettingsOpen(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.settingsBtn}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <SectionList
        sections={historySections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          historySections.length === 0 && styles.emptyList,
        ]}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={historyLoading}
            onRefresh={refetch}
            tintColor="#FF6B35"
            colors={["#FF6B35"]}
          />
        }
        ListHeaderComponent={
          <>
            {/* 유저 정보 카드 */}
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.email} numberOfLines={1}>
                  {user?.email}
                </Text>
                <Text style={styles.joinedAt}>가입일: {joinedDate}</Text>
              </View>
            </View>

            {/* 통계 카드 */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{uniqueVisitedCount}</Text>
                <Text style={styles.statLabel}>방문 식당</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{historyCount}</Text>
                <Text style={styles.statLabel}>총 방문 횟수</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{favCount}</Text>
                <Text style={styles.statLabel}>즐겨찾기</Text>
              </View>
            </View>

            {/* 로그아웃 버튼 */}
            <TouchableOpacity
              style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
              onPress={handleSignOut}
              disabled={signingOut}
            >
              <Text style={styles.signOutText}>
                {signingOut ? "로그아웃 중..." : "로그아웃"}
              </Text>
            </TouchableOpacity>

            {/* 히스토리 섹션 헤더 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>방문 기록</Text>
              <View style={styles.sectionHeaderRight}>
                <Text style={styles.sectionCount}>
                  {historyLoading ? "..." : `${historyCount}건`}
                </Text>
                {historyCount > 0 && (
                  <TouchableOpacity
                    onPress={handleClearHistory}
                    disabled={clearHistory.isPending}
                  >
                    <Text style={styles.clearHistoryBtn}>
                      {clearHistory.isPending ? "삭제 중..." : "전체 삭제"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {historyLoading && <LoadingView message="방문 기록 불러오는 중..." fullScreen={false} />}
            {isError && !historyLoading && (
              <ErrorView
                message={
                  error instanceof Error
                    ? error.message
                    : "방문 기록을 불러오지 못했습니다."
                }
                onRetry={refetch}
                fullScreen={false}
              />
            )}
          </>
        }
        ListEmptyComponent={
          !historyLoading && !isError ? (
            <EmptyView
              title="방문 기록이 없습니다"
              subtitle="음식점 상세 페이지에 진입하면 자동으로 기록됩니다."
              actionLabel="음식점 검색하러 가기"
              onAction={() => router.push("/")}
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.dateSectionHeader}>
            <Text style={styles.dateSectionText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <RestaurantCard
            restaurant={{
              id: item.restaurant_id,
              name: item.restaurant_name,
              region: item.restaurant_region,
              category: "",
              address: "",
              latitude: 0,
              longitude: 0,
            }}
            onPress={() => handleCardPress(item)}
            visitedAt={item.visited_at}
            visitCount={visitCounts[item.restaurant_id]}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemSep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#1a1a1a" },
  settingsBtn: { fontSize: 22 },

  list: { padding: 12, gap: 0 },
  emptyList: { flex: 1 },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  profileInfo: { flex: 1, gap: 4 },
  email: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  joinedAt: { fontSize: 12, color: "#999" },

  /* 통계 카드 */
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statNum: { fontSize: 22, fontWeight: "800", color: "#FF6B35" },
  statLabel: { fontSize: 11, color: "#999" },
  statDivider: { width: 1, height: 36, backgroundColor: "#eee" },

  signOutBtn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffd5c8",
  },
  signOutBtnDisabled: { opacity: 0.5 },
  signOutText: { fontSize: 14, fontWeight: "600", color: "#FF6B35" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  sectionCount: { fontSize: 13, color: "#888" },
  clearHistoryBtn: { fontSize: 12, color: "#FF3B30" },

  /* 날짜 그룹 헤더 */
  dateSectionHeader: {
    paddingTop: 16,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  dateSectionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.4,
  },

  itemSep: { height: 8 },
});
