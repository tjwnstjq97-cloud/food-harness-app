/**
 * RealMapView 타입 선언.
 * 실제 구현은 platform extension(.native.tsx / .web.tsx) 으로 분기.
 * 이 파일은 TypeScript가 `import { RealMapView } from "./RealMapView"` 를
 * 해석할 수 있게 공통 타입만 제공한다.
 */
import type { ReactNode, MemoExoticComponent } from "react";
import type { Restaurant } from "../types/restaurant";
import type { Region } from "../types/region";

export interface RealMapViewProps {
  region: Region;
  restaurants: Restaurant[];
  selectedId?: string | null;
  onMarkerPress?: (r: Restaurant) => void;
  fallback: ReactNode;
  height?: number;
}

export const RealMapView: MemoExoticComponent<
  (props: RealMapViewProps) => JSX.Element
>;
