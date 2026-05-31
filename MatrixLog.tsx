import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const LOG_LINES = [
  "[SYS] Quantum mesh initialized — 256-bit lattice encryption active",
  "[NET] Routing through 7 anonymous relay nodes... established",
  "[AUTH] Zero-knowledge proof verification: PASS",
  "[MEM] Volatile buffer allocated — 0% retention on exit",
  "[CRYPTO] AES-256-GCM session keys generated",
  "[P2P] Decentralized DHT lookup: 847 peers discovered",
  "[SEC] Ghost protocol layer: ACTIVE",
  "[SYS] Metadata stripping engine: RUNNING",
  "[NET] Onion routing path: node_4f2a → node_9c1d → node_7e3b",
  "[AUTH] Biometric shadow hash: ████████████████ CONFIRMED",
  "[STORE] RAM-only storage mode engaged — no disk writes",
  "[PROTO] Perfect forward secrecy: ENABLED",
  "[SYS] Neural firewall scanning inbound vectors...",
  "[NET] Encrypted tunnel latency: 0.34ms",
  "[GHOST] Identity mask applied — signature randomized",
  "[SEC] Traffic analysis countermeasures: DEPLOYED",
  "[CRYPTO] Ephemeral key exchange: Curve25519",
  "[SYS] Intrusion detection matrix: NO THREATS",
  "[NET] VPN bypass layer: ACTIVE",
  "[AUTH] Anonymous credential tokens refreshed",
];

export function MatrixLog() {
  const colors = useColors();
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const shuffled = [...LOG_LINES].sort(() => Math.random() - 0.5);

    const add = () => {
      const line = shuffled[indexRef.current % shuffled.length];
      indexRef.current++;
      setDisplayedLines((prev) => [...prev.slice(-14), line]);
      scrollRef.current?.scrollToEnd({ animated: true });
    };

    add();
    const interval = setInterval(add, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: "#030309", borderColor: "rgba(168,85,247,0.2)" },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
        <View style={[styles.dot, { backgroundColor: "#f59e0b" }]} />
        <View style={[styles.dot, { backgroundColor: "#22c55e" }]} />
        <Text style={[styles.title, { color: colors.mutedForeground }]}>
          SYSTEM LOG — LIVE
        </Text>
        <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {displayedLines.map((line, i) => {
          const isNew = i === displayedLines.length - 1;
          const isAuth = line.includes("[AUTH]");
          const isNet = line.includes("[NET]");
          const isSec = line.includes("[SEC]") || line.includes("[CRYPTO]");
          const color = isAuth
            ? colors.accent
            : isNet
            ? "#60a5fa"
            : isSec
            ? colors.primary
            : "#4ade80";
          return (
            <Text
              key={`${i}-${line.slice(0, 10)}`}
              style={[
                styles.line,
                { color: isNew ? color : `${color}88` },
              ]}
            >
              {isNew ? "▶ " : "  "}
              {line}
            </Text>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    height: 180,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(168,85,247,0.2)",
    backgroundColor: "rgba(168,85,247,0.05)",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: "auto",
  },
  title: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  line: {
    fontSize: 9.5,
    fontFamily: "monospace" as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
});
