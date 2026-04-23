/**
 * MenuSection — 대표 메뉴 목록 컴포넌트
 * 하네스 규칙: source 없는 메뉴 표시 금지, 추정 가격 표기 필수.
 * 데이터 없으면 fallback 메시지 표시.
 */
import { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { formatMenuPrice } from "../types/menu";
import type { MenuItem } from "../types/menu";
import { cozyTheme } from "../utils/theme";

const colors = cozyTheme.colors;

interface MenuSectionProps {
  items: MenuItem[];
  isLoading?: boolean;
  title?: string;
  /** 이 개수 이상이면 접기/펼치기 버튼 표시 (기본 5개) */
  collapseAfter?: number;
}

const PRICE_STATUS_COLOR: Record<string, string> = {
  confirmed: "#4CAF50",
  estimated: "#FF9800",
  unknown:   "#9E9E9E",
};

function MenuItemRow({ item }: { item: MenuItem }) {
  const priceColor = PRICE_STATUS_COLOR[item.priceStatus] ?? "#9E9E9E";

  return (
    <View style={styles.menuRow}>
      <View style={styles.menuLeft}>
        <View style={styles.menuNameRow}>
          {item.isSignature && (
            <View style={styles.signatureBadge}>
              <Text style={styles.signatureText}>대표</Text>
            </View>
          )}
          <Text style={styles.menuName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        {!!item.description && (
          <Text style={styles.menuDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <Text style={[styles.menuPrice, { color: priceColor }]}>
        {formatMenuPrice(item)}
      </Text>
    </View>
  );
}

export function MenuSection({
  items,
  isLoading = false,
  title = "메뉴",
  collapseAfter = 5,
}: MenuSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = items.length > collapseAfter;
  const visibleItems = canCollapse && !expanded ? items.slice(0, collapseAfter) : items;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : items.length === 0 ? (
          <Text style={styles.noData}>메뉴 정보가 없습니다.</Text>
        ) : (
          <>
            {visibleItems.map((item, idx) => (
              <MenuItemRow key={`${item.name}-${idx}`} item={item} />
            ))}
            {canCollapse && (
              <TouchableOpacity
                style={styles.expandBtn}
                onPress={() => setExpanded((v) => !v)}
              >
                <Text style={styles.expandText}>
                  {expanded
                    ? "▲ 접기"
                    : `▼ 전체 메뉴 보기 (${items.length}개)`}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.sourceNote}>
              * 출처 있는 메뉴만 표시됩니다.
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: 12, marginBottom: 4 },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: cozyTheme.radius.lg,
    padding: 14,
    shadowColor: cozyTheme.shadow.color,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: cozyTheme.shadow.opacity,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  noData: { fontSize: 14, color: colors.textSubtle },
  sourceNote: { fontSize: 11, color: colors.textSubtle, marginTop: 2 },
  expandBtn: {
    paddingVertical: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  expandText: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  menuRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: { flex: 1, gap: 2 },
  menuNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  signatureBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  signatureText: { fontSize: 10, color: colors.primary, fontWeight: "700" },
  menuName: { fontSize: 14, color: colors.text, fontWeight: "500", flex: 1 },
  menuDesc: { fontSize: 12, color: colors.textSubtle },
  menuPrice: { fontSize: 13, fontWeight: "600", marginLeft: 8 },
});
