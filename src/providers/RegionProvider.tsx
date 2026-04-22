/**
 * Region Provider
 * KR/GLOBAL 분기를 앱 전체에 제공한다.
 * region 분기 없이 지도 기능 사용 금지.
 */
import { createContext, useContext, type ReactNode } from "react";
import { useRegionStore } from "../stores/regionStore";
import type { Region } from "../types/region";

interface RegionContextValue {
  region: Region;
  setRegion: (region: Region) => void;
  isKR: boolean;
  isGlobal: boolean;
}

const RegionContext = createContext<RegionContextValue>({
  region: "KR",
  setRegion: () => {},
  isKR: true,
  isGlobal: false,
});

export function useRegion() {
  return useContext(RegionContext);
}

interface Props {
  children: ReactNode;
}

export function RegionProvider({ children }: Props) {
  const { region, setRegion } = useRegionStore();

  return (
    <RegionContext.Provider
      value={{
        region,
        setRegion,
        isKR: region === "KR",
        isGlobal: region === "GLOBAL",
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}
