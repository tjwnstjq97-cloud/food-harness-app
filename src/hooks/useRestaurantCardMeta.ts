import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getSignatureMenus } from "../types/menu";
import { getReservationLabel } from "../types/reservation";

export interface RestaurantCardMeta {
  averageRating?: number;
  reviewCount: number;
  reservationLabel?: string;
  waitingLabel?: string;
  signatureMenus: string[];
}

type RestaurantCardMetaMap = Record<string, RestaurantCardMeta>;

function createEmptyMeta(): RestaurantCardMeta {
  return {
    reviewCount: 0,
    signatureMenus: [],
  };
}

function isSafeTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST301" ||
    error.message?.includes("does not exist") === true
  );
}

export function useRestaurantCardMeta(restaurantIds: string[]) {
  const ids = [...new Set(restaurantIds)].filter(Boolean);

  return useQuery({
    queryKey: ["restaurant-card-meta", ids],
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 3,
    retry: 1,
    queryFn: async (): Promise<RestaurantCardMetaMap> => {
      const baseMap = ids.reduce<RestaurantCardMetaMap>((acc, id) => {
        acc[id] = createEmptyMeta();
        return acc;
      }, {});

      const [reviewsRes, menusRes, reservationsRes, waitingRes] = await Promise.all([
        supabase
          .from("reviews")
          .select("restaurant_id, rating, source")
          .in("restaurant_id", ids),
        supabase
          .from("menus")
          .select("restaurant_id, name, is_signature, mention_count, source")
          .in("restaurant_id", ids)
          .order("is_signature", { ascending: false })
          .order("mention_count", { ascending: false }),
        supabase
          .from("reservations")
          .select("restaurant_id, status")
          .in("restaurant_id", ids),
        supabase
          .from("waiting")
          .select("restaurant_id, minutes, confidence")
          .in("restaurant_id", ids),
      ]);

      if (reviewsRes.error && !isSafeTableError(reviewsRes.error)) throw reviewsRes.error;
      if (menusRes.error && !isSafeTableError(menusRes.error)) throw menusRes.error;
      if (reservationsRes.error && !isSafeTableError(reservationsRes.error)) throw reservationsRes.error;
      if (waitingRes.error && !isSafeTableError(waitingRes.error)) throw waitingRes.error;

      const reviewBuckets = new Map<string, { total: number; sum: number }>();
      for (const row of reviewsRes.data ?? []) {
        const restaurantId = String(row.restaurant_id ?? "");
        const source = String(row.source ?? "");
        if (!restaurantId || !source) continue;

        const rating = Number(row.rating ?? 0);
        const bucket = reviewBuckets.get(restaurantId) ?? { total: 0, sum: 0 };
        bucket.total += 1;
        bucket.sum += rating;
        reviewBuckets.set(restaurantId, bucket);
      }

      for (const [restaurantId, bucket] of reviewBuckets.entries()) {
        if (!baseMap[restaurantId]) continue;
        baseMap[restaurantId].reviewCount = bucket.total;
        baseMap[restaurantId].averageRating =
          bucket.total > 0 ? Math.round((bucket.sum / bucket.total) * 10) / 10 : undefined;
      }

      const menuBuckets = new Map<
        string,
        Array<{ name: string; isSignature: boolean; mentionCount?: number; source: string }>
      >();
      for (const row of menusRes.data ?? []) {
        const restaurantId = String(row.restaurant_id ?? "");
        const source = String(row.source ?? "");
        const name = String(row.name ?? "");
        if (!restaurantId || !source || !name) continue;

        const bucket = menuBuckets.get(restaurantId) ?? [];
        bucket.push({
          name,
          isSignature: Boolean(row.is_signature ?? false),
          mentionCount: row.mention_count ? Number(row.mention_count) : undefined,
          source,
        });
        menuBuckets.set(restaurantId, bucket);
      }

      for (const [restaurantId, bucket] of menuBuckets.entries()) {
        if (!baseMap[restaurantId]) continue;
        const topMenus = getSignatureMenus(
          bucket.map((item) => ({
            name: item.name,
            price: 0,
            priceStatus: "unknown" as const,
            isSignature: item.isSignature,
            source: item.source,
            mentionCount: item.mentionCount,
          })),
          2
        ).map((item) => item.name);

        baseMap[restaurantId].signatureMenus = topMenus;
      }

      for (const row of reservationsRes.data ?? []) {
        const restaurantId = String(row.restaurant_id ?? "");
        if (!baseMap[restaurantId]) continue;
        baseMap[restaurantId].reservationLabel = getReservationLabel(
          (row.status as Parameters<typeof getReservationLabel>[0]) ?? "unknown"
        );
      }

      for (const row of waitingRes.data ?? []) {
        const restaurantId = String(row.restaurant_id ?? "");
        if (!baseMap[restaurantId]) continue;
        const minutes = Number(row.minutes ?? 0);
        const confidence = String(row.confidence ?? "unknown");
        baseMap[restaurantId].waitingLabel =
          confidence === "realtime" ? `${minutes}분` : `약 ${minutes}분`;
      }

      return baseMap;
    },
  });
}
