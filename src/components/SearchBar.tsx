/**
 * SearchBar — 공통 검색 바 컴포넌트
 * 홈 탭(index.tsx)에서 분리. 다른 화면에서도 재사용 가능.
 */
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { cozyTheme } from "../utils/theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  buttonLabel?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  size?: "default" | "large";
  containerStyle?: StyleProp<ViewStyle>;
  onClear?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = "식당 이름, 지역 검색...",
  buttonLabel = "검색",
  accessibilityLabel,
  disabled = false,
  size = "default",
  containerStyle,
  onClear,
}: SearchBarProps) {
  const isLarge = size === "large";
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.trim().length > 0;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge, containerStyle]}>
      <View
        style={[
          styles.inputShell,
          isLarge && styles.inputShellLarge,
          isFocused && styles.inputShellFocused,
        ]}
        testID="search-bar-input-shell"
      >
        <FontAwesome
          name="search"
          size={isLarge ? 18 : 15}
          color={isFocused ? cozyTheme.colors.primary : cozyTheme.colors.textSubtle}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, isLarge && styles.inputLarge]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          editable={!disabled}
          accessibilityLabel={accessibilityLabel ?? placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID="search-bar-input"
        />
        {hasValue && !disabled && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              if (onClear) {
                onClear();
                return;
              }
              onChangeText("");
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="검색어 지우기"
            testID="search-bar-clear-button"
          >
            <FontAwesome
              name="times-circle"
              size={16}
              color={cozyTheme.colors.textSubtle}
            />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, isLarge && styles.buttonLarge, disabled && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${buttonLabel} 실행`}
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
  containerLarge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    gap: 10,
  },
  inputShell: {
    flex: 1,
    minWidth: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: cozyTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: cozyTheme.colors.surfaceSoft,
  },
  inputShellLarge: {
    height: 54,
    borderRadius: 14,
    backgroundColor: cozyTheme.colors.white,
    borderColor: cozyTheme.colors.borderStrong,
  },
  inputShellFocused: {
    borderColor: cozyTheme.colors.primary,
    shadowColor: cozyTheme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    width: 20,
    textAlign: "center",
    marginRight: 6,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingHorizontal: 0,
    fontSize: 15,
    color: cozyTheme.colors.text,
  },
  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputLarge: {
    fontSize: 17,
    fontWeight: "600",
  },
  button: {
    height: 44,
    minWidth: 58,
    flexShrink: 0,
    paddingHorizontal: 18,
    backgroundColor: cozyTheme.colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonLarge: {
    height: 54,
    minWidth: 76,
    borderRadius: 14,
    paddingHorizontal: 20,
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
