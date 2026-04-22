/**
 * SearchBar — 공통 검색 바 컴포넌트
 * 홈 탭(index.tsx)에서 분리. 다른 화면에서도 재사용 가능.
 */
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { cozyTheme } from "../utils/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "식당 이름, 지역 검색...",
  buttonLabel = "검색",
  disabled = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: cozyTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: cozyTheme.colors.border,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: cozyTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: cozyTheme.colors.surfaceSoft,
    color: cozyTheme.colors.text,
  },
  button: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: cozyTheme.colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: cozyTheme.colors.primarySoft,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
