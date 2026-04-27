/**
 * DisplayNameModal — 프로필 디스플레이 이름 편집 (Phase E)
 *
 * 동작:
 *  - 현재 displayName을 입력 필드에 미리 채움
 *  - 저장 → useAuthActions.updateDisplayName 호출
 *  - 빈 문자열은 null로 정규화 (이메일 fallback 복귀)
 *  - 30자 제한
 */
import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { cozyTheme } from "../utils/theme";
import { useAuthActions } from "../hooks/useAuth";

const colors = cozyTheme.colors;
const MAX_LEN = 30;

interface Props {
  visible: boolean;
  currentName: string | null | undefined;
  onClose: () => void;
  onSaved?: (newName: string | null) => void;
}

export function DisplayNameModal({
  visible,
  currentName,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState<string>(currentName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateDisplayName } = useAuthActions();

  useEffect(() => {
    if (visible) {
      setName(currentName ?? "");
      setError(null);
    }
  }, [visible, currentName]);

  const trimmed = name.trim();
  const tooLong = trimmed.length > MAX_LEN;
  const canSave = !saving && !tooLong;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = trimmed.length === 0 ? null : trimmed;
      await updateDisplayName(next);
      onSaved?.(next);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "이름 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>이름 변경</Text>
          <Text style={styles.subtitle}>
            프로필에 표시될 이름이에요. 비워 두면 이메일이 표시돼요.
          </Text>

          <TextInput
            style={[styles.input, tooLong && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="예: 준섭"
            placeholderTextColor={colors.textSubtle}
            maxLength={MAX_LEN + 10}
            autoFocus
            accessibilityLabel="디스플레이 이름 입력"
          />
          <View style={styles.counterRow}>
            <Text style={[styles.counter, tooLong && styles.counterError]}>
              {trimmed.length} / {MAX_LEN}
            </Text>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                !canSave && styles.btnDisabled,
              ]}
              onPress={handleSave}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel="이름 저장"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: cozyTheme.radius.lg,
    padding: 18,
    gap: 10,
  },
  title: { fontSize: 17, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: cozyTheme.radius.md,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceSoft,
  },
  inputError: { borderColor: colors.negative },
  counterRow: { alignItems: "flex-end" },
  counter: { fontSize: 11, color: colors.textSubtle },
  counterError: { color: colors.negative, fontWeight: "700" },
  errorText: { fontSize: 12, color: colors.negative, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8, marginTop: 6 },
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
  btnDisabled: { backgroundColor: colors.surfaceMuted },
});
