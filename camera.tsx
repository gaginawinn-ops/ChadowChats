import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";

type CamMode = "PHOTO" | "VIDEO";
const MODES: CamMode[] = ["PHOTO", "VIDEO"];

export default function CameraScreen() {
  const { chatId, chatType } = useLocalSearchParams<{ chatId: string; chatType: string }>();
  const { user } = useAuth();
  const { sendMessage, sendGroupMessage, uploadMedia } = useChat();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<CamMode>("PHOTO");
  const [sending, setSending] = useState(false);

  const handleCapture = async () => {
    if (sending) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera Permission", "Please allow camera access to take photos and videos.");
      return;
    }

    const isVideo = mode === "VIDEO";
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: isVideo ? ["videos"] : ["images"],
      quality: isVideo ? 0.6 : 0.85,
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    setSending(true);
    try {
      const ext = isVideo ? "mp4" : "jpg";
      const path = `${chatType}/${chatId}/${Date.now()}.${ext}`;
      const url = await uploadMedia(asset.uri, path);
      const payload = {
        senderId: user!.uid,
        senderName: user!.username,
        text: "",
        type: isVideo ? ("video" as const) : ("image" as const),
        mediaUrl: url,
        timestamp: Date.now(),
        isAnonymous: false,
        replyTo: null,
      };
      if (chatType === "groups") {
        await sendGroupMessage(chatId!, payload);
      } else {
        await sendMessage(chatId!, payload);
      }
      router.back();
    } catch (e) {
      Alert.alert("Failed to send", String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Background grid pattern ── */}
      <View style={styles.gridOverlay} />

      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === "web" ? 20 : insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.glassCircle}>
          <Feather name="x" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>CAMERA</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Center icon ── */}
      <View style={styles.center}>
        <View style={styles.bigIconWrap}>
          {sending ? (
            <ActivityIndicator size="large" color="#a855f7" />
          ) : mode === "VIDEO" ? (
            <Feather name="video" size={64} color="rgba(255,255,255,0.15)" />
          ) : (
            <Feather name="camera" size={64} color="rgba(255,255,255,0.15)" />
          )}
        </View>
        {sending && (
          <Text style={styles.sendingText}>Uploading…</Text>
        )}
      </View>

      {/* ── Bottom Controls ── */}
      <View style={[styles.bottomArea, { paddingBottom: Platform.OS === "web" ? 32 : insets.bottom + 24 }]}>
        {/* Mode Selector — Apple camera style */}
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modePill, m === mode && styles.modePillActive]}
            >
              <Text style={[styles.modeText, m === mode && styles.modeTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shutter Row */}
        <View style={styles.shutterRow}>
          {/* Spacer */}
          <View style={{ width: 56 }} />

          {/* Shutter */}
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleCapture}
            disabled={sending}
            activeOpacity={0.85}
          >
            <View style={[
              styles.shutterInner,
              mode === "VIDEO" && styles.shutterInnerVideo,
            ]} />
          </TouchableOpacity>

          {/* Mode icon on right */}
          <View style={styles.modeIcon}>
            <Feather
              name={mode === "VIDEO" ? "video" : "aperture"}
              size={22}
              color="rgba(255,255,255,0.7)"
            />
          </View>
        </View>

        <Text style={styles.hint}>
          {mode === "VIDEO" ? "Tap to record video (max 60s)" : "Tap to take a photo"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#060608",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    opacity: 0.05,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  topCenter: { flex: 1, alignItems: "center" },
  topTitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "700", letterSpacing: 2 },

  glassCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  // Center
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  bigIconWrap: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  sendingText: { color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "600" },

  // Bottom
  bottomArea: {
    alignItems: "center",
    gap: 28,
    paddingTop: 32,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
  },

  // Mode row — Apple-style
  modeRow: { flexDirection: "row", gap: 6 },
  modePill: {
    paddingHorizontal: 20, paddingVertical: 7, borderRadius: 24,
  },
  modePillActive: {
    backgroundColor: "rgba(255,214,10,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,214,10,0.3)",
  },
  modeText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13, fontWeight: "600", letterSpacing: 0.5,
  },
  modeTextActive: { color: "#FFD60A" },

  // Shutter
  shutterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 36,
  },
  shutterOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },
  shutterInner: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: "#fff",
  },
  shutterInnerVideo: {
    width: 46, height: 46, borderRadius: 10,
    backgroundColor: "#FF3B30",
  },
  modeIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },

  hint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "500",
  },
});
