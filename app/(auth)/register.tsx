/**
 * 회원가입 화면
 * Supabase Auth 연동.
 * - 비밀번호 표시/숨김 토글
 * - 비밀번호 강도 표시기
 * - 인라인 유효성 검사
 */
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuthActions } from "../../src/hooks/useAuth";

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: "#ddd" };
  if (pw.length < 6) return { level: 1, label: "너무 짧음", color: "#e53e3e" };
  if (pw.length < 8) return { level: 2, label: "보통", color: "#dd6b20" };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { level: 4, label: "강함", color: "#38a169" };
  return { level: 3, label: "양호", color: "#3182ce" };
}

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { signUp } = useAuthActions();

  const strength = getPasswordStrength(password);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const validateEmail = (val: string) => {
    if (!val.trim()) return "이메일을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return "올바른 이메일 형식이 아닙니다.";
    return "";
  };

  const handleRegister = async () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    if (!password.trim()) {
      Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("입력 오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("입력 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await signUp({ email: email.trim(), password });
      Alert.alert(
        "회원가입 완료 🎉",
        "이메일 인증 링크를 확인해주세요.\n인증 후 로그인할 수 있습니다.",
        [{ text: "확인", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      Alert.alert("회원가입 실패", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>새 계정을 만들어보세요</Text>

        <View style={styles.form}>
          {/* 이메일 */}
          <View>
            <TextInput
              style={[styles.input, !!emailError && styles.inputError]}
              placeholder="이메일"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(v) => { setEmail(v); setEmailError(""); }}
              onBlur={() => setEmailError(validateEmail(email))}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* 비밀번호 */}
          <View>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="비밀번호 (6자 이상)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            {/* 비밀번호 강도 바 */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBar}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        { backgroundColor: i <= strength.level ? strength.color : "#e0e0e0" },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* 비밀번호 확인 */}
          <View>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, passwordMismatch && styles.inputError]}
                placeholder="비밀번호 확인"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            {passwordMismatch && (
              <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>회원가입</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>로그인</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  title: { fontSize: 32, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 36 },
  form: { gap: 14 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  inputError: { borderColor: "#e53e3e", backgroundColor: "#fff5f5" },
  errorText: { fontSize: 12, color: "#e53e3e", marginTop: 4, marginLeft: 4 },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 50 },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  eyeIcon: { fontSize: 18 },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  strengthBar: { flex: 1, flexDirection: "row", gap: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "600", minWidth: 36, textAlign: "right" },
  button: {
    height: 52,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: "#666", fontSize: 14 },
  linkText: { color: "#FF6B35", fontSize: 14, fontWeight: "600" },
});
