import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Message } from "@/context/ChatContext";

interface ChatBubbleProps {
  message: Message;
  isMe: boolean;
  onLongPress?: () => void;
  onReply?: (msg: Message) => void;
}

export function ChatBubble({ message, isMe, onLongPress, onReply }: ChatBubbleProps) {
  const colors = useColors();
  const swipeRef = useRef<Swipeable>(null);
  const [playing, setPlaying] = useState(false);
  const [soundObj, setSoundObj] = useState<Audio.Sound | null>(null);
  const [imgModal, setImgModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const bubbleColor = isMe ? "rgba(168,85,247,0.22)" : colors.card;
  const borderColor = isMe ? "rgba(168,85,247,0.45)" : colors.border;

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePlayAudio = async () => {
    if (!message.mediaUrl) return;
    setLoading(true);
    try {
      if (soundObj) {
        await soundObj.stopAsync();
        await soundObj.unloadAsync();
        setSoundObj(null);
        setPlaying(false);
        return;
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true }
      );
      setSoundObj(sound);
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((s) => {
        if ("didJustFinish" in s && s.didJustFinish) {
          setPlaying(false);
          setSoundObj(null);
          sound.unloadAsync();
        }
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Swipe-right reveal: left actions = reply hint
  const renderLeftActions = () => (
    <View style={styles.swipeAction}>
      <View style={[styles.swipeCircle, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` }]}>
        <Feather name="corner-up-left" size={18} color={colors.primary} />
      </View>
    </View>
  );

  const handleSwipeOpen = () => {
    onReply?.(message);
    // snap back immediately
    setTimeout(() => swipeRef.current?.close(), 120);
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={onReply ? renderLeftActions : undefined}
      onSwipeableOpen={onReply ? handleSwipeOpen : undefined}
      leftThreshold={55}
      friction={2}
      overshootLeft={false}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onLongPress={onLongPress}
        onPress={message.type === "image" || message.type === "video" ? () => setImgModal(true) : undefined}
        style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}
      >
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {message.isAnonymous ? "??" : message.senderName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ maxWidth: "75%", gap: 3 }}>
          {!isMe && (
            <Text style={[styles.sender, { color: message.isAnonymous ? colors.mutedForeground : colors.primary }]}>
              {message.isAnonymous ? "Anonymous" : message.senderName}
            </Text>
          )}

          {/* Reply quote */}
          {message.replyTo && (
            <View style={[styles.replyQuote, { backgroundColor: colors.muted, borderColor: colors.primary }]}>
              <Text style={[styles.replyName, { color: colors.primary }]}>{message.replyTo.senderName}</Text>
              <Text style={[styles.replyText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {message.replyTo.text || "Media"}
              </Text>
            </View>
          )}

          <View style={[styles.bubble, { backgroundColor: bubbleColor, borderColor }]}>
            {message.type === "text" || message.type === "reply" ? (
              <Text style={[styles.text, { color: colors.foreground }]}>{message.text}</Text>
            ) : message.type === "image" ? (
              <Image source={{ uri: message.mediaUrl }} style={styles.image} resizeMode="cover" />
            ) : message.type === "audio" ? (
              <TouchableOpacity style={styles.audioRow} onPress={handlePlayAudio}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Feather name={playing ? "pause-circle" : "play-circle"} size={28} color={colors.primary} />
                )}
                <View style={[styles.audioWave, { backgroundColor: colors.primary }]} />
                <Text style={[styles.audioLabel, { color: colors.mutedForeground }]}>
                  {playing ? "Playing…" : "Voice"}
                </Text>
              </TouchableOpacity>
            ) : message.type === "video" ? (
              <TouchableOpacity style={styles.videoThumb} onPress={() => setImgModal(true)}>
                <Feather name="play-circle" size={36} color="#fff" />
                <Text style={styles.videoLabel}>Video</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.time, { color: colors.mutedForeground }, isMe && styles.timeRight]}>
            {time}
            {isMe && <Text style={{ color: colors.accent }}>  ✓✓</Text>}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={imgModal} transparent animationType="fade" onRequestClose={() => setImgModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setImgModal(false)} activeOpacity={1}>
          {message.mediaUrl && (
            <Image source={{ uri: message.mediaUrl }} style={styles.modalImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeAction: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 16,
    width: 72,
  },
  swipeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "flex-end", marginVertical: 3, paddingHorizontal: 12, gap: 6 },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 11, fontWeight: "700" },
  sender: { fontSize: 10, fontWeight: "700", marginLeft: 4, letterSpacing: 0.3 },
  replyQuote: { borderLeftWidth: 2, paddingLeft: 8, paddingVertical: 4, paddingRight: 8, borderRadius: 6, marginBottom: 2 },
  replyName: { fontSize: 9, fontWeight: "700" },
  replyText: { fontSize: 10 },
  bubble: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  text: { fontSize: 14, lineHeight: 20 },
  image: { width: 210, height: 155, borderRadius: 12 },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, minWidth: 160 },
  audioWave: { flex: 1, height: 3, borderRadius: 2, opacity: 0.5 },
  audioLabel: { fontSize: 11 },
  videoThumb: { width: 180, height: 120, borderRadius: 12, backgroundColor: "#000", alignItems: "center", justifyContent: "center", gap: 4 },
  videoLabel: { color: "#fff", fontSize: 11 },
  time: { fontSize: 10, marginLeft: 4 },
  timeRight: { textAlign: "right", marginRight: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  modalImage: { width: "100%", height: "82%" },
});
