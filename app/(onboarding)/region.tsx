/**
 * 첫 진입 region 선택 온보딩 (Phase A)
 *
 * 동작:
 *  - 사용자가 KR/GLOBAL 카드를 탭 → regionStore에 반영 → onboardingStore.complete()
 *  - 완료 시 (tabs)로 replace
 *
 * 하네스 규칙:
 *  - region 분기 없는 진입 차단 (KR이 기본이지만 사용자에게 명시적 선택권 제공)
 *  - 추측 금지: 위치 권한 요청 없이 사용자 선택 우선
 */
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useRegionStore } from "../../src/stores/regionStore";
import { useOnboardingStore } from "../../src/stores/onboardingStore";
import { cozyTheme } from "../../src/utils/theme";
import type { Region } from "../../src/types/region";

const colors = cozyTheme.colors;

interface RegionOption {
  region: Region;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
}

const OPTIONS: RegionOption[] = [
  {
    region: "KR",
    emoji: "🇰🇷",
    title: "국내 (한국)",
    subtitle: "Naver Map 기반",
    description: "한국 음식점·메뉴·웨이팅 정보에 최적화",
  },
  {
    region: "GLOBAL",
    emoji: "🌏",
    title: "해외",
    subtitle: "Google Map 기반",
    description: "전 세계 음식점 검색 + 영문 리뷰 키워드",
  },
];

export default function RegionOnboardingScreen() {
  const router = useRouter();
  const setRegion = useRegionStore((s) => s.setRegion);
  const completeOnboarding = useOnboardingStore((s) => s.complete);
  const [selected, setSelected] = useState<Region | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    setRegion(selected);
    completeOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>처음이시네요!</Text>
          <Text style={styles.title}>어디에서 음식점을 찾으시나요?</Text>
          <Text style={styles.subtitle}>
            지역에 따라 사용하는 지도와 검색 소스가 달라요.{"\n"}
            나중에 설정에서 언제든 바꿀 수 있어요.
          </Text>
        </View>

        <View style={styles.optionList}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.region;
            const accent = opt.region === "KR" ? colors.kr : colors.global;
            const accentSoft =
              opt.region === "KR" ? colors.krSoft : colors.globalSoft;
            return (
              <TouchableOpacity
                key={opt.region}
                style={[
                  styles.optionCard,
                  active && {
                    borderColor: accent,
                    backgroundColor: accentSoft,
                  },
                ]}
                onPress={() => setSelected(opt.region)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${opt.title} 선택`}
                activeOpacity={0.85}
              >
                <View style={styles.optionTop}>
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>
                    <Text style={[styles.optionSubtitle, { color: accent }]}>
                      {opt.subtitle}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      active && { borderColor: accent, backgroundColor: accent },
                    ]}
                  >
                    {active && <Text style={styles.radioCheck}>✓</Text>}
                  </View>
                </View>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !selected && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selected}
            accessibilityRole="button"
            accessibilityLabel="선택한 지역으로 시작"
          >
            <Text
              style={[
                styles.confirmText,
                !selected && styles.confirmTextDisabled,
              ]}
            >
              {selected ? "시작하기" : "지역을 선택해주세요"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.note}>
            * 설정 → 지역에서 언제든 변경할 수 있어요.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  heroBlock: { gap: 8 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: 4,
  },

  optionList: { gap: 12 },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: cozyTheme.radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
    shadowColor: cozyTheme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: cozyTheme.shadow.opacity,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionEmoji: { fontSize: 28 },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  optionSubtitle: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  optionDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCheck: { color: "#fff", fontSize: 14, fontWeight: "800" },

  bottom: { gap: 8 },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: cozyTheme.radius.lg,
    alignItems: "center",
  },
  confirmBtnDisabled: { backgroundColor: colors.surfaceMuted },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  confirmTextDisabled: { color: colors.textSubtle },
  note: { fontSize: 11, color: colors.textSubtle, textAlign: "center" },
});
