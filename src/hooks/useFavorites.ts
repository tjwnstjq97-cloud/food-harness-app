/**
 * 즐겨찾기 hook
 * 하네스 규칙: user_id 기반 소유권 분리 필수. RLS로 DB에서도 강제.
 * - 중복 저장 방지: DB UNIQUE(user_id, restaurant_id) + 클라이언트 사전 체크
 * - isFavorite(): 상세 페이지 토글 상태 확인용
 * - 낙관적 업데이트 없음 (단순 invalidate 방식, 안전 우선)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { FavoriteRow } from "../types/restaurant";

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async (): Promise<FavoriteRow[]> => {
      if (!user) throw new Error("로그인 필요");
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FavoriteRow[];
    },
    enabled: !!user,
  });

  /** 즐겨찾기 여부 확인 */
  const isFavorite = (restaurantId: string): boolean => {
    return (
      query.data?.some((f) => f.restaurant_id === restaurantId) ?? false
    );
  };

  const addFavorite = useMutation({
    mutationFn: async (params: {
      restaurant_id: string;
      restaurant_name: string;
      restaurant_region: string;
    }) => {
      if (!user) throw new Error("로그인 필요");

      // 클라이언트 사전 체크 (DB UNIQUE 제약과 이중 방어)
      if (isFavorite(params.restaurant_id)) {
        return; // 이미 즐겨찾기 — 무시
      }

      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, ...params });

      // DB UNIQUE 제약 위반(23505) → 이미 있음 — 무시
      if (error && error.code !== "23505") {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
    onError: (err) => {
      console.warn("[favorites] addFavorite error:", err);
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (restaurantId: string): Promise<void> => {
      if (!user) throw new Error("로그인 필요");
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
    onError: (err) => {
      console.warn("[favorites] removeFavorite error:", err);
    },
  });

  /** 토글: 현재 상태를 반전 */
  const toggleFavorite = (params: {
    restaurant_id: string;
    restaurant_name: string;
    restaurant_region: string;
  }) => {
    if (isFavorite(params.restaurant_id)) {
      removeFavorite.mutate(params.restaurant_id);
    } else {
      addFavorite.mutate(params);
    }
  };

  return {
    ...query,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isToggling:
      addFavorite.isPending || removeFavorite.isPending,
  };
}
