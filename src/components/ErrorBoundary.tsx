/**
 * ErrorBoundary — 자식 트리에서 발생한 React 렌더 에러를 잡아
 * 흰 화면(WSOD) 대신 친절한 폴백 UI를 보여준다.
 *
 * 적용 위치: app/_layout.tsx 의 root.
 *
 * 하네스 규칙: source 없는 정보 노출 금지. 사용자에게는 안내만 보여주고
 * 디버그 메시지는 __DEV__ 모드일 때만 표시한다.
 */
import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

interface Props {
  children: ReactNode;
  /** 폴백 UI를 직접 지정하려면 사용 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 콘솔에는 console.info 만 사용 (validator 규칙)
    console.info("[ErrorBoundary] caught", error.message, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>💥</Text>
        <Text style={styles.title}>예상치 못한 오류가 발생했습니다</Text>
        <Text style={styles.subtitle}>
          잠시 후 다시 시도해주세요.{"\n"}계속되면 앱을 재시작해주세요.
        </Text>

        {__DEV__ && this.state.error && (
          <ScrollView style={styles.devBox} contentContainerStyle={styles.devBoxContent}>
            <Text style={styles.devLabel}>DEBUG</Text>
            <Text style={styles.devText}>{this.state.error.message}</Text>
            {this.state.error.stack && (
              <Text style={styles.devStack}>{this.state.error.stack}</Text>
            )}
          </ScrollView>
        )}

        <TouchableOpacity style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  icon: { fontSize: 56 },
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#777", textAlign: "center", lineHeight: 20 },
  button: {
    marginTop: 12,
    paddingHorizontal: 26,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  devBox: {
    marginTop: 12,
    maxHeight: 220,
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  devBoxContent: { padding: 10, gap: 6 },
  devLabel: { color: "#FF6B35", fontWeight: "700", fontSize: 11 },
  devText: { color: "#fff", fontSize: 12, fontFamily: "Menlo" },
  devStack: { color: "#bbb", fontSize: 10, fontFamily: "Menlo", marginTop: 6 },
});
