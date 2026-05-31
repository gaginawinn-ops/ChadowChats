import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Group } from "@/context/ChatContext";

interface Props {
  group: Group;
  isMember: boolean;
  onPress: () => void;
  onJoin: () => void;
  unreadCount?: number;
}

export function GroupListItem({ group, isMember, onPress, onJoin, unreadCount = 0 }: Props) {
  const colors = useColors();
  const iconColor = group.type === "public" ? colors.accent : colors.primary;
  const iconName = group.type === "public" ? "globe" : "users";

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={isMember ? onPress : undefined}
      activeOpacity={isMember ? 0.7 : 1}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18`, borderColor: `${iconColor}30` }]}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={[styles.groupId, { color: colors.mutedForeground }]}>
            #{group.groupId}
          </Text>
        </View>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {group.description || `${group.members.length} members`}
        </Text>
      </View>
      {isMember ? (
        unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        ) : (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        )
      ) : (
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: `${iconColor}15`, borderColor: `${iconColor}40` }]}
          onPress={onJoin}
        >
          <Text style={[styles.joinText, { color: iconColor }]}>JOIN</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  content: { flex: 1, gap: 3 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", flex: 1 },
  groupId: { fontSize: 10, fontWeight: "600" },
  desc: { fontSize: 12 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  joinBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  joinText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
});
