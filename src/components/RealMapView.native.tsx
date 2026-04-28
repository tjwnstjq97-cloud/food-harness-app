/**
 * RealMapView — region별 실제 지도 SDK 분기 (Phase 18 / Phase 21+).
 *
 * 하네스 규칙: "region 분기 없이 지도 기능 구현 금지"
 *  - KR: @mj-studio/react-native-naver-map (NaverMapView)
 *  - GLOBAL: react-native-maps (MapView, PROVIDER_GOOGLE)
 *
 * Expo Go에서는 네이티브 모듈 미포함 → 동적 require로 안전하게 로드.
 * 모듈 로드 실패 시 호출자가 전달한 fallback을 렌더 (기존 그리드 UI 유지).
 *
 * 마커 좌표가 모두 (0,0)이면 SDK 없이도 의미가 없으므로 fallback.
 */
import { memo, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import type { ReactNode } from "react";
import type { Restaurant } from "../types/restaurant";
import type { Region } from "../types/region";

interface RealMapViewProps {
  region: Region;
  restaurants: Restaurant[];
  selectedId?: string | null;
  onMarkerPress?: (r: Restaurant) => void;
  /** 네이티브 SDK 로드 실패 / 좌표 없음일 때 표시할 fallback */
  fallback: ReactNode;
  height?: number;
}

function RealMapViewImpl({
  region,
  restaurants,
  selectedId,
  onMarkerPress,
  fallback,
  height = 300,
}: RealMapViewProps) {
  const withCoords = useMemo(
    () =>
      restaurants.filter(
        (r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && (r.latitude !== 0 || r.longitude !== 0)
      ),
    [restaurants]
  );

  const center = useMemo(() => {
    if (withCoords.length === 0) return { latitude: 0, longitude: 0 };
    const lat = withCoords.reduce((s, r) => s + r.latitude, 0) / withCoords.length;
    const lng = withCoords.reduce((s, r) => s + r.longitude, 0) / withCoords.length;
    return { latitude: lat, longitude: lng };
  }, [withCoords]);

  // 좌표 0개면 지도 의미 없음 → fallback
  if (withCoords.length === 0) {
    return <>{fallback}</>;
  }

  if (region === "KR") {
    return (
      <NaverMapBranch
        restaurants={withCoords}
        center={center}
        selectedId={selectedId}
        onMarkerPress={onMarkerPress}
        fallback={fallback}
        height={height}
      />
    );
  }

  return (
    <GoogleMapBranch
      restaurants={withCoords}
      center={center}
      selectedId={selectedId}
      onMarkerPress={onMarkerPress}
      fallback={fallback}
      height={height}
    />
  );
}

export const RealMapView = memo(RealMapViewImpl);

interface BranchProps {
  restaurants: Restaurant[];
  center: { latitude: number; longitude: number };
  selectedId?: string | null;
  onMarkerPress?: (r: Restaurant) => void;
  fallback: ReactNode;
  height: number;
}

/**
 * KR: 네이버 지도. Expo Go에는 없는 네이티브 모듈이라 동적 require.
 * 클라이언트 ID는 app.config.js plugin 설정에서 native build 시 주입됨.
 */
function NaverMapBranch({
  restaurants,
  center,
  selectedId,
  onMarkerPress,
  fallback,
  height,
}: BranchProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let naverMod: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    naverMod = require("@mj-studio/react-native-naver-map");
  } catch (e) {
    console.info("[RealMapView] NaverMap 모듈 로드 실패 — Expo Go 또는 prebuild 미실행", e instanceof Error ? e.message : "unknown");
    return (
      <View style={[styles.fallbackBox, { height }]}>
        {fallback}
        <Text style={styles.fallbackHint}>
          ※ 실제 지도는 dev build (expo prebuild) 실행 후 표시됩니다.
        </Text>
      </View>
    );
  }

  const NaverMapView = naverMod.NaverMapView ?? naverMod.default;
  const NaverMapMarkerOverlay = naverMod.NaverMapMarkerOverlay ?? naverMod.NaverMapMarker;

  if (!NaverMapView) {
    return <>{fallback}</>;
  }

  return (
    <View style={{ height }}>
      <NaverMapView
        style={{ flex: 1 }}
        camera={{
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: 13,
        }}
      >
        {restaurants.map((r) => (
          <NaverMapMarkerOverlay
            key={r.id}
            latitude={r.latitude}
            longitude={r.longitude}
            caption={{ text: r.name }}
            tintColor={r.id === selectedId ? "#C9651E" : "#1976D2"}
            onTap={() => onMarkerPress?.(r)}
          />
        ))}
      </NaverMapView>
    </View>
  );
}

/**
 * GLOBAL: react-native-maps + PROVIDER_GOOGLE.
 * iOS는 GoogleMapsAPIKey app.config.js에서 주입, Android는 manifest 자동.
 */
function GoogleMapBranch({
  restaurants,
  center,
  selectedId,
  onMarkerPress,
  fallback,
  height,
}: BranchProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapsMod: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mapsMod = require("react-native-maps");
  } catch (e) {
    console.info("[RealMapView] react-native-maps 모듈 로드 실패 — Expo Go 또는 prebuild 미실행", e instanceof Error ? e.message : "unknown");
    return (
      <View style={[styles.fallbackBox, { height }]}>
        {fallback}
        <Text style={styles.fallbackHint}>
          ※ 실제 지도는 dev build (expo prebuild) 실행 후 표시됩니다.
        </Text>
      </View>
    );
  }

  const MapView = mapsMod.default;
  const Marker = mapsMod.Marker;
  const PROVIDER_GOOGLE = mapsMod.PROVIDER_GOOGLE;

  if (!MapView) {
    return <>{fallback}</>;
  }

  return (
    <View style={{ height }}>
      <MapView
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {restaurants.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude, longitude: r.longitude }}
            title={r.name}
            description={r.address}
            pinColor={r.id === selectedId ? "#C9651E" : "#1976D2"}
            onPress={() => onMarkerPress?.(r)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackBox: {
    position: "relative",
  },
  fallbackHint: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#999",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingVertical: 2,
  },
});
