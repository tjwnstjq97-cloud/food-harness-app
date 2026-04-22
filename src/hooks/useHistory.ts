/**
 * TASK 7: 히스토리 hook
 * user_id 기반 소유권 분리 필수.
 * - addVisit: 방문 기록 추가
 * - clearHistory: 전체 방문 기록 삭제
 * - visitCounts: restaurant_id별 방문 횟수 맵 (중복 표시용)
 */
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { HistoryRow } from "../types/restaurant";

export function useHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async (): Promise<HistoryRow[]> => {
      if (!user) throw new Error("로그인 필요");
      const { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", user.id)
        .order("visited_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HistoryRow[];
    },
    enabled: !!user,
  });

  /** restaurant_id → 방문 횟수 맵 */
  const visitCounts = useMemo<Record<string, number>>(() => {
    if (!query.data) return {};
    return query.data.reduce<Record<string, number>>((acc, row) => {
      acc[row.restaurant_id] = (acc[row.restaurant_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [query.data]);

  const addVisit = useMutation({
    mutationFn: async (restaurantData: {
      restaurant_id: string;
      restaurant_name: string;
      restaurant_region: string;
    }) => {
      if (!user) throw new Error("로그인 필요");
      const { error } = await supabase.from("history").insert({
        user_id: user.id,
        ...restaurantData,
        visited_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history", user?.id] });
    },
  });

  /** 전체 방문 기록 삭제 */
  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인 필요");
      const { error } = await supabase
        .from("history")
        .delete()
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history", user?.id] });
    },
  });

  return { ...query, addVisit, clearHistory, visitCounts };
}
