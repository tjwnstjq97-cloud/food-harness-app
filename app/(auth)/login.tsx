/**
 * 로그인 화면
 * Supabase Auth 연동.
 * - 비밀번호 표시/숨김 토글
 * - 유효성 검사 인라인 표시
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
import { Link } from "expo-router";
import { useAuthActions } from "../../src/hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const { signIn } = useAuthActions();

  const validateEmail = (val: string) => {
    if (!val.trim()) return "이메일을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return "올바른 이메일 형식이 아닙니다.";
    return "";
  };

  const handleLogin = async () => {
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    if (!password.trim()) {
      Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      // 성공 시 AuthProvider가 자동으로 (tabs)로 리다이렉트
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "로그인에 실패했습니다.";
      Alert.alert("로그인 실패", message);
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
        {/* 로고 */}
        <Text style={styles.logo}>🍽️</Text>
        <Text style={styles.title}>로그인</Text>
        <Text style={styles.subtitle}>음식점 탐색을 시작하세요</Text>

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
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="비밀번호"
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>계정이 없으신가요? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>회원가입</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  title: { fontSize: 32, fontWeight: "bold", color: "#1a1a1a", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 40 },
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
