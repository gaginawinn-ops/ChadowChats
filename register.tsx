import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Passkey must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
      router.replace("/(tabs)/");
    } catch (e: unknown) {
      Alert.alert("Registration Failed", e instanceof Error ? e.message : "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40), paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <View style={[styles.badge, { borderColor: "rgba(168,85,247,0.35)", backgroundColor: "rgba(168,85,247,0.1)" }]}>
              <Feather name="zap" size={10} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>NEW NODE REGISTRATION</Text>
            </View>
            <Text style={[styles.appName, { color: colors.primary }]}>SHADOWCHAT</Text>
            <Text style={[styles.version, { color: colors.mutedForeground }]}>Generate your clearance credentials</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>CREATE ACCESS NODE</Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>ANON HANDLE</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="at-sign" size={14} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="GhostOperator"
                  placeholderTextColor={colors.mutedForeground}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>GMAIL NODE</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="mail" size={14} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="node@proton.me"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSKEY ARRAY</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="key" size={14} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder="Min 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Feather name={showPw ? "eye-off" : "eye"} size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}
            >
              <Text style={styles.btnText}>{loading ? "GENERATING..." : "GENERATE CREDENTIALS"}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Already have clearance? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.owner, { color: "rgba(100,100,120,0.4)" }]}>
            SYSTEM OWNER: MATHEESHA SASMIN
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center" },
  brandRow: { alignItems: "center", marginBottom: 32 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  appName: { fontSize: 38, fontWeight: "900", letterSpacing: -1 },
  version: { fontSize: 12, fontWeight: "600", marginTop: 4, textAlign: "center" },
  card: { width: "100%", maxWidth: 420, borderRadius: 20, padding: 24, borderWidth: 1 },
  cardTitle: { fontSize: 15, fontWeight: "900", letterSpacing: 1, marginBottom: 24, textAlign: "center" },
  field: { marginBottom: 16 },
  label: { fontSize: 9, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 14 },
  eyeBtn: { padding: 6 },
  btn: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 0.8 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 12 },
  footerLink: { fontSize: 12, fontWeight: "700" },
  owner: { fontSize: 8, marginTop: 24, letterSpacing: 1 },
});
