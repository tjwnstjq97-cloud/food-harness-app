/**
 * 검색어 매칭 부분을 굵게 강조해서 보여주는 텍스트 컴포넌트.
 * - case-insensitive 매칭
 * - query 가 비었거나 매칭되지 않으면 원본 그대로 표시
 * - 한글/영문 모두 동작
 */
import { Text, StyleSheet, type StyleProp, type TextStyle } from "react-native";

interface Props {
  text: string;
  query?: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightText({
  text,
  query,
  style,
  highlightStyle,
  numberOfLines,
}: Props) {
  const q = query?.trim();
  if (!q) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const re = new RegExp(`(${escapeRegExp(q)})`, "gi");
  const parts = text.split(re);
  const lower = q.toLowerCase();

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <Text key={i} style={[styles.highlight, highlightStyle]}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    fontWeight: "800",
    color: "#FF6B35",
    backgroundColor: "#FFF0EB",
  },
});
