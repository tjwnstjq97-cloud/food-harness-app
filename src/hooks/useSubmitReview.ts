/**
 * 사용자 리뷰 작성/수정/삭제 hook (Phase 19)
 *
 * 하네스 규칙:
 *  - source 필수 → 항상 "user" 고정
 *  - sentiment 필수 → 별점에 따라 자동 분류 (4.0+ positive / 2.5- negative / 그 외 neutral)
 *  - user_id 필수 → auth.uid() (RLS로 강제, 클라이언트도 명시)
 *  - 본인 리뷰만 수정/삭제 가능 (RLS로 강제)
 *
 * 중복 방지:
 *  - DB UNIQUE(user_id, restaurant_id) 제약 → 한 사용자가 한 음식점에 1개 리뷰만
 *  - 23505 (UNIQUE 위반) → "이미 리뷰를 작성하셨습니다" 안내
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { ReviewSentiment } from "../types/review";

interface SubmitParams {
  restaurantId: string;
  text: string;
  rating: number;          // 1.0 ~ 5.0
}

interface UpdateParams {
  reviewId: string;
  text: string;
  rating: number;
}

/** 별점 → sentiment 자동 분류 (LLM 없이 안전한 룰 기반) */
function ratingToSentiment(rating: number): ReviewSentiment {
  if (rating >= 4.0) return "positive";
  if (rating <= 2.5) return "negative";
  return "neutral";
}

/** 텍스트/별점 클라이언트 사전 검증 */
function validateInput(text: string, rating: number): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 5) return "리뷰는 5자 이상 작성해주세요";
  if (trimmed.length > 500) return "리뷰는 500자 이하로 작성해주세요";
  if (!Number.isFinite(rating) || rating < 1.0 || rating > 5.0) {
    return "별점은 1.0 ~ 5.0 사이여야 합니다";
  }
  return null;
}

export function useSubmitReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateReviews = (restaurantId: string) => {
    // useReviews queryKey: ["reviews", restaurantId, userId]
    queryClient.invalidateQueries({ queryKey: ["reviews", restaurantId] });
  };

  const submit = useMutation({
    mutationFn: async (params: SubmitParams): Promise<void> => {
      if (!user) throw new Error("로그인이 필요합니다");
      const validationError = validateInput(params.text, params.rating);
      if (validationError) throw new Error(validationError);

      const { error } = await supabase.from("reviews").insert({
        restaurant_id: params.restaurantId,
        user_id:       user.id,
        text:          params.text.trim(),
        rating:        params.rating,
        source:        "user",
        sentiment:     ratingToSentiment(params.rating),
      });

      if (error) {
        // 23505 = UNIQUE 제약 위반 (중복 작성)
        if (error.code === "23505") {
          throw new Error("이미 이 음식점에 리뷰를 작성하셨습니다. 수정 또는 삭제 후 다시 시도하세요.");
        }
        throw error;
      }
    },
    onSuccess: (_data, vars) => invalidateReviews(vars.restaurantId),
  });

  const update = useMutation({
    mutationFn: async (params: UpdateParams & { restaurantId: string }): Promise<void> => {
      if (!user) throw new Error("로그인이 필요합니다");
      const validationError = validateInput(params.text, params.rating);
      if (validationError) throw new Error(validationError);

      const { error } = await supabase
        .from("reviews")
        .update({
          text:      params.text.trim(),
          rating:    params.rating,
          sentiment: ratingToSentiment(params.rating),
        })
        .eq("id", params.reviewId)
        .eq("user_id", user.id); // 이중 방어 (RLS와 함께)

      if (error) throw error;
    },
    onSuccess: (_data, vars) => invalidateReviews(vars.restaurantId),
  });

  const remove = useMutation({
    mutationFn: async (params: { reviewId: string; restaurantId: string }): Promise<void> => {
      if (!user) throw new Error("로그인이 필요합니다");
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", params.reviewId)
        .eq("user_id", user.id); // 이중 방어
      if (error) throw error;
    },
    onSuccess: (_data, vars) => invalidateReviews(vars.restaurantId),
  });

  return {
    submit,
    update,
    remove,
    isSubmitting: submit.isPending || update.isPending || remove.isPending,
  };
}
