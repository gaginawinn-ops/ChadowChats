import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  name: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  status: string;
  onPress: () => void;
}

function formatTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ChatListItem({ name, lastMessage, lastMessageTime, unreadCount, status, onPress }: Props) {
  const colors = useColors();
  const initials = name.slice(0, 2).toUpperCase();
  const statusColor =
    status === "online"
      ? colors.accent
      : status === "away"
      ? "#f59e0b"
      : colors.mutedForeground;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarWrap, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: statusColor, borderColor: colors.background },
          ]}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {formatTime(lastMessageTime)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.lastMsg, { color: colors.mutedForeground }]} numberOfLines={1}>
            {lastMessage || "No messages yet"}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", position: "relative" },
  initials: { fontSize: 16, fontWeight: "800" },
  statusDot: { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, borderWidth: 2 },
  content: { flex: 1, gap: 4 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  time: { fontSize: 11 },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lastMsg: { fontSize: 13, flex: 1, marginRight: 8 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
