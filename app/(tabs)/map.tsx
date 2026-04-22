/**
 * 지도 탭
 * 현재: 준비 중 안내 화면 + 빠른 검색 버튼
 * 예정: 네이버 지도 SDK (KR) / 구글 지도 SDK (GLOBAL)
 *
 * 활성화 조건:
 *   1. NAVER_MAP_CLIENT_ID → .env 에 입력
 *   2. react-native-naver-map 패키지 설치 + expo prebuild 재실행
 */
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useRegion } from "../../src/providers/RegionProvider";
import { usePendingSearchStore } from "../../src/stores/pendingSearchStore";
import { useSearchHistoryStore } from "../../src/stores/searchHistoryStore";

const QUICK_SEARCH_KR = [
  { label: "🍜 라멘", query: "라멘" },
  { label: "🥩 고기집", query: "고기" },
  { label: "🍣 초밥", query: "초밥" },
  { label: "🍕 피자", query: "피자" },
  { label: "☕ 카페", query: "카페" },
  { label: "🍛 한식", query: "한식" },
  { label: "🥗 샐러드", query: "샐러드" },
  { label: "🍔 버거", query: "버거" },
];

const QUICK_SEARCH_GLOBAL = [
  { label: "🍣 Sushi", query: "sushi" },
  { label: "🍕 Pizza", query: "pizza" },
  { label: "🍜 Ramen", query: "ramen" },
  { label: "🥩 BBQ", query: "bbq" },
  { label: "☕ Cafe", query: "cafe" },
  { label: "🍔 Burger", query: "burger" },
  { label: "🌮 Tacos", query: "tacos" },
  { label: "🍛 Curry", query: "curry" },
];

export default function MapScreen() {
  const { region } = useRegion();
  const router = useRouter();
  const { setPendingQuery } = usePendingSearchStore();
  const { addQuery } = useSearchHistoryStore();
  const isKR = region === "KR";

  const quickSearchItems = isKR ? QUICK_SEARCH_KR : QUICK_SEARCH_GLOBAL;

  const handleQuickSearch = (query: string) => {
    addQuery(query);
    setPendingQuery(query);
    router.push("/");
  };

  const openNaverConsole = () =>
    Linking.openURL("https://console.ncloud.com/naver-service/application");
  const openGoogleConsole = () =>
    Linking.openURL("https://console.cloud.google.com/apis/library/places-backend.googleapis.com");

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 아이콘 + 타이틀 */}
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>지도 기능 준비 중</Text>
      <Text style={styles.sub}>
        현재 지역:{" "}
        <Text style={styles.region}>
          {isKR ? "🇰🇷 KR (네이버 지도)" : "🌏 GLOBAL (구글 지도)"}
        </Text>
      </Text>

      {/* 빠른 검색 */}
      <View style={styles.quickSection}>
        <Text style={styles.quickTitle}>
          {isKR ? "🔥 지금 찾기" : "🔥 Quick Search"}
        </Text>
        <View style={styles.chipGrid}>
          {quickSearchItems.map(({ label, query }) => (
            <TouchableOpacity
              key={query}
              style={styles.chip}
              onPress={() => handleQuickSearch(query)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 지도 활성화 안내 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>지도 기능 활성화하려면</Text>

        {isKR ? (
          <>
            <Text style={styles.step}>1. Naver Cloud Console에서 지도 API 키 발급</Text>
            <Text style={styles.step}>2. .env 에 NAVER_MAP_CLIENT_ID 입력</Text>
            <Text style={styles.step}>3. react-native-naver-map 설치</Text>
            <Text style={styles.step}>4. npx expo run:ios 재실행</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={openNaverConsole}>
              <Text style={styles.linkText}>Naver Cloud Console 열기 →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.step}>1. Google Cloud Console에서 Maps SDK 활성화</Text>
            <Text style={styles.step}>2. .env 에 GOOGLE_MAPS_API_KEY 입력</Text>
            <Text style={styles.step}>3. react-native-maps 설치</Text>
            <Text style={styles.step}>4. npx expo run:ios 재실행</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={openGoogleConsole}>
              <Text style={styles.linkText}>Google Cloud Console 열기 →</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f5f5" },
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 16,
  },
  icon: { fontSize: 56 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  sub: { fontSize: 14, color: "#666" },
  region: { fontWeight: "600", color: "#FF6B35" },

  /* 빠른 검색 */
  quickSection: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#FFF0EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD5C8",
  },
  chipText: { fontSize: 13, color: "#FF6B35", fontWeight: "600" },

  /* 활성화 안내 카드 */
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    width: "100%",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#888", marginBottom: 4 },
  step: { fontSize: 13, color: "#444", lineHeight: 22 },
  linkBtn: {
    marginTop: 6,
    paddingVertical: 10,
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    alignItems: "center",
  },
  linkText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
