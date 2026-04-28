/**
 * RealMapView (web) — 웹 빌드용 stub.
 * 네이티브 지도 SDK는 웹에서 동작 불가 → fallback만 렌더한다.
 * 실제 구현은 RealMapView.native.tsx 에 있고, Metro가 platform extension으로 분기.
 */
import { memo } from "react";
import type { ReactNode } from "react";
import type { Restaurant } from "../types/restaurant";
import type { Region } from "../types/region";

interface RealMapViewProps {
  region: Region;
  restaurants: Restaurant[];
  selectedId?: string | null;
  onMarkerPress?: (r: Restaurant) => void;
  fallback: ReactNode;
  height?: number;
}

function RealMapViewWebImpl({ fallback }: RealMapViewProps) {
  return <>{fallback}</>;
}

export const RealMapView = memo(RealMapViewWebImpl);
