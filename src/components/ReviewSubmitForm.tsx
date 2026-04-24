/**
 * ReviewSubmitForm — 사용자 리뷰 작성/수정 폼 (Phase 19)
 *
 * 동작:
 *  - rating: 별 5개 탭 → 1~5점 (0.5 단위는 미지원, 정수 평점)
 *  - text: 5~500자 멀티라인
 *  - 제출 → useSubmitReview.submit 또는 update 호출
 *  - 모드: "create" | "edit" 자동 분기 (existingReview 유무로)
 *
 * 하네스 규칙:
 *  - source 필수 → useSubmitReview에서 "user" 강제 설정
 *  - sentiment 필수 → 별점 기반 자동 분류
 *  - 작성자 본인 외 수정 불가 (RLS)
 */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { cozyTheme } from "../utils/theme";
import { useSubmitReview } from "../hooks/useSubmitReview";
import type { Review } from "../types/review";

const colors = cozyTheme.colors;

interface Props {
  restaurantId: string;
  /** 수정 모드일 때 기존 리뷰 (undefined면 새 작성) */
  existingReview?: Review;
  /** 폼 닫기 콜백 */
  onClose: () => void;
  /** 성공 시 토스트 등 표시용 */
  onSuccess?: (mode: "create" | "edit") => void;
}

const MIN_LEN = 5;
const MAX_LEN = 500;

export function ReviewSubmitForm({
  restaurantId,
  existingReview,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!existingReview;
  const [rating, setRating] = useState<number>(existingReview?.rating ?? 4);
  const [text, setText] = useState<string>(existingReview?.text ?? "");
  const [error, setError] = useState<string | null>(null);

  const { submit, update, isSubmitting } = useSubmitReview();

  // existingReview 변경 시 폼 초기화
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setText(existingReview.text);
    }
  }, [existingReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const trimmedLen = text.trim().length;
  const canSubmit =
    !isSubmitting &&
    trimmedLen >= MIN_LEN &&
    trimmedLen <= MAX_LEN &&
    rating >= 1 &&
    rating <= 5;

  const handleSubmit = async () => {
    setError(null);
    try {
      if (isEdit && existingReview) {
        await update.mutateAsync({
          reviewId: existingReview.id,
          restaurantId,
          text,
          rating,
        });
        onSuccess?.("edit");
      } else {
        await submit.mutateAsync({ restaurantId, text, rating });
        onSuccess?.("create");
      }
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "리뷰 저장에 실패했습니다";
      setError(msg);
    }
  };

  const handleCancel = () => {
    if (trimmedLen > 0 && !isEdit) {
      Alert.alert(
        "작성 취소",
        "작성 중인 내용이 사라집니다. 정말 취소할까요?",
        [
          { text: "계속 작성", style: "cancel" },
          { text: "취소", style: "destructive", onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEdit ? "리뷰 수정" : "리뷰 작성"}</Text>
        <TouchableOpacity
          onPress={handleCancel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="리뷰 폼 닫기"
        >
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* 별점 */}
      <View style={styles.section}>
        <Text style={styles.label}>별점</Text>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = n <= rating;
            return (
              <TouchableOpacity
                key={n}
                onPress={() => setRating(n)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityLabel={`별점 ${n}점`}
                accessibilityRole="button"
              >
                <Text style={[styles.star, filled && styles.starFilled]}>
                  {filled ? "★" : "☆"}
                </Text>
              </TouchableOpacity>
            );
          })}
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* 텍스트 */}
      <View style={styles.section}>
        <Text style={styles.label}>리뷰 내용</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="음식 / 분위기 / 서비스 등 솔직한 후기를 5자 이상 작성해주세요"
          placeholderTextColor={colors.textSubtle}
          multiline
          maxLength={MAX_LEN + 50} // 살짝 여유, 클라이언트 검증으로 막음
          textAlignVertical="top"
          accessibilityLabel="리뷰 내용 입력"
        />
        <View style={styles.counterRow}>
          <Text
            style={[
              styles.counter,
              (trimmedLen < MIN_LEN || trimmedLen > MAX_LEN) && styles.counterError,
            ]}
          >
            {trimmedLen} / {MAX_LEN}
          </Text>
          {trimmedLen < MIN_LEN && (
            <Text style={styles.hint}>최소 {MIN_LEN}자 이상</Text>
          )}
        </View>
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* 출처 표시 (하네스 규칙: source 명시) */}
      <Text style={styles.sourceNote}>
        * 이 리뷰는 [직접 입력]으로 표시됩니다. 작성 후 본인만 수정/삭제할 수 있습니다.
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={handleCancel}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          <Text style={styles.btnSecondaryText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.btn,
            styles.btnPrimary,
            !canSubmit && styles.btnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? "리뷰 수정 완료" : "리뷰 등록"}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>
              {isEdit ? "수정 완료" : "리뷰 등록"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: cozyTheme.radius.lg,
    padding: 14,
    gap: 12,
    shadowColor: cozyTheme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: cozyTheme.shadow.opacity,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  closeBtn: { fontSize: 18, color: colors.textMuted, paddingHorizontal: 4 },

  section: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted },

  starRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  star: {
    fontSize: 28,
    color: colors.borderStrong,
  },
  starFilled: { color: colors.primary },
  ratingText: {
    marginLeft: 8,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "600",
  },

  input: {
    minHeight: 96,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: cozyTheme.radius.md,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surfaceSoft,
    lineHeight: 20,
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: { fontSize: 11, color: colors.textSubtle },
  counterError: { color: colors.negative, fontWeight: "700" },
  hint: { fontSize: 11, color: colors.textSubtle },

  errorBox: {
    backgroundColor: colors.negativeSoft,
    borderRadius: cozyTheme.radius.sm,
    padding: 8,
  },
  errorText: { fontSize: 12, color: colors.negative, fontWeight: "600" },

  sourceNote: { fontSize: 11, color: colors.textSubtle, lineHeight: 16 },

  actionRow: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: cozyTheme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnSecondary: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: { color: colors.text, fontWeight: "600", fontSize: 14 },
  btnDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
});
