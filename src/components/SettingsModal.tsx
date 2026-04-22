/**
 * 설정 모달 — 프로필 탭 우측 상단 ⚙️ 버튼에서 열림.
 * - 지역 (KR/GLOBAL) 전환
 * - 앱 버전 정보
 * - 캐시 정리(검색 기록) 등 가벼운 옵션
 */
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { useRegion } from "../providers/RegionProvider";
import { useSearchHistoryStore } from "../stores/searchHistoryStore";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: Props) {
  const { region, setRegion } = useRegion();
  const clearAll = useSearchHistoryStore((s) => s.clearAll);

  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? "0.0.0";

  const handleClearSearchHistory = () => {
    Alert.alert("검색 기록 삭제", "모든 검색 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => clearAll(),
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>닫기</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {/* 지역 */}
            <Text style={styles.sectionLabel}>지역</Text>
            <View style={styles.regionRow}>
              <TouchableOpacity
                style={[styles.regionBtn, region === "KR" && styles.regionBtnActive]}
                onPress={() => setRegion("KR")}
              >
                <Text style={[styles.regionText, region === "KR" && styles.regionTextActive]}>
                  🇰🇷 국내 (KR)
                </Text>
                <Text style={styles.regionSub}>네이버 검색/지도 사용</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.regionBtn, region === "GLOBAL" && styles.regionBtnActive]}
                onPress={() => setRegion("GLOBAL")}
              >
                <Text style={[styles.regionText, region === "GLOBAL" && styles.regionTextActive]}>
                  🌏 해외 (GLOBAL)
                </Text>
                <Text style={styles.regionSub}>구글 검색/지도 사용</Text>
              </TouchableOpacity>
            </View>

            {/* 데이터 관리 */}
            <Text style={styles.sectionLabel}>데이터</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleClearSearchHistory}>
              <Text style={styles.menuItemIcon}>🧹</Text>
              <View style={styles.menuItemBody}>
                <Text style={styles.menuItemTitle}>검색 기록 삭제</Text>
                <Text style={styles.menuItemSub}>저장된 최근 검색어를 모두 비웁니다.</Text>
              </View>
            </TouchableOpacity>

            {/* 앱 정보 */}
            <Text style={styles.sectionLabel}>앱 정보</Text>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemIcon}>ℹ️</Text>
              <View style={styles.menuItemBody}>
                <Text style={styles.menuItemTitle}>버전</Text>
                <Text style={styles.menuItemSub}>v{appVersion}</Text>
              </View>
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemIcon}>🛡️</Text>
              <View style={styles.menuItemBody}>
                <Text style={styles.menuItemTitle}>하네스 엔지니어링</Text>
                <Text style={styles.menuItemSub}>
                  source 없는 정보 표시 금지 · 추측 금지 · region 분기 필수
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#1a1a1a" },
  closeBtn: { fontSize: 14, color: "#FF6B35", fontWeight: "600" },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.4,
  },

  regionRow: { flexDirection: "row", gap: 8 },
  regionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    gap: 4,
  },
  regionBtnActive: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF0EB",
  },
  regionText: { fontSize: 14, fontWeight: "700", color: "#555" },
  regionTextActive: { color: "#FF6B35" },
  regionSub: { fontSize: 11, color: "#999" },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 12,
    gap: 12,
    marginBottom: 6,
  },
  menuItemIcon: { fontSize: 20 },
  menuItemBody: { flex: 1 },
  menuItemTitle: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  menuItemSub: { fontSize: 12, color: "#888", marginTop: 2 },
});
