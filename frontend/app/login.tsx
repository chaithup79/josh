// Login screen — simple phone + name + role selection
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { MapPin, ShieldCheck, User as UserIcon, Wrench } from "phosphor-react-native";
import { api, auth } from "../src/api";
import { useTheme, spacing, radius } from "../src/theme";

const ROLES: { key: "citizen" | "admin" | "engineer"; label: string; icon: any; desc: string }[] = [
  { key: "citizen", label: "Citizen", icon: UserIcon, desc: "Report potholes in your area" },
  { key: "engineer", label: "BBMP Engineer", icon: Wrench, desc: "Field staff updates" },
  { key: "admin", label: "BBMP Admin", icon: ShieldCheck, desc: "Assign & track resolution" },
];

export default function Login() {
  const router = useRouter();
  const { t, isDark } = useTheme();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"citizen" | "engineer" | "admin">("citizen");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setErr("Please enter your name and phone");
      return;
    }
    if ((role === "admin" || role === "engineer") && !inviteCode.trim()) {
      setErr("BBMP invite code is required for staff access");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const user = await api.login(name.trim(), phone.trim(), role, inviteCode.trim() || undefined);
      await auth.saveSession(user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      const msg = String(e?.message || "Login failed");
      setErr(msg.includes("403") ? "Invalid BBMP invite code" : msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="login-screen">
      <LinearGradient
        colors={[t.brandPrimary, "#052E16"]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={["top"]}>
          <View style={{ padding: spacing.xl, paddingTop: spacing.lg }}>
            <View style={styles.logoRow}>
              <MapPin size={28} color="#fff" weight="fill" />
              <Text style={styles.brand}>NammaRoad</Text>
            </View>
            <Text style={styles.heroTitle}>Fix Namma Bengaluru, one road at a time</Text>
            <Text style={styles.heroSub}>
              Snap a pothole. Pin it. BBMP gets it. Simple as that.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.label, { color: t.onSurface }]}>Full name</Text>
          <TextInput
            testID="login-name-input"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={t.onSurfaceSecondary}
            style={[
              styles.input,
              { color: t.onSurface, backgroundColor: t.surfaceSecondary, borderColor: t.border },
            ]}
          />

          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.md }]}>
            Phone number
          </Text>
          <TextInput
            testID="login-phone-input"
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile"
            placeholderTextColor={t.onSurfaceSecondary}
            keyboardType="phone-pad"
            maxLength={10}
            style={[
              styles.input,
              { color: t.onSurface, backgroundColor: t.surfaceSecondary, borderColor: t.border },
            ]}
          />

          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>I am a</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => {
              const active = role === r.key;
              const Icon = r.icon;
              return (
                <Pressable
                  key={r.key}
                  testID={`role-${r.key}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRole(r.key);
                  }}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: active ? t.brandPrimary : t.surfaceSecondary,
                      borderColor: active ? t.brandPrimary : t.border,
                    },
                  ]}
                >
                  <Icon size={22} color={active ? "#fff" : t.onSurface} weight={active ? "fill" : "regular"} />
                  <Text
                    style={{
                      color: active ? "#fff" : t.onSurface,
                      fontWeight: "600",
                      marginTop: 6,
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {(role === "admin" || role === "engineer") && (
            <>
              <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.md }]}>
                BBMP invite code
              </Text>
              <TextInput
                testID="invite-code-input"
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="e.g. BBMP-2026"
                placeholderTextColor={t.onSurfaceSecondary}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  { color: t.onSurface, backgroundColor: t.brandTertiary, borderColor: t.brandPrimary, borderWidth: 1.5 },
                ]}
              />
              <Text style={{ color: t.onSurfaceSecondary, fontSize: 11, marginTop: 6 }}>
                Required for BBMP staff. Contact your ward officer if you don&apos;t have one.
              </Text>
            </>
          )}

          {err ? <Text style={[styles.err, { color: t.error }]}>{err}</Text> : null}

          <Pressable
            testID="login-submit"
            onPress={submit}
            disabled={loading}
            style={[styles.submit, { backgroundColor: t.brandPrimary, opacity: loading ? 0.6 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Continue</Text>
            )}
          </Pressable>

          <Text style={{ color: t.onSurfaceSecondary, fontSize: 11, marginTop: spacing.lg, textAlign: "center" }}>
            New users: just enter your details to create an account. BBMP staff need an invite code from your ward officer.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: spacing.xl },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.lg },
  brand: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", lineHeight: 32, letterSpacing: -0.5 },
  heroSub: { color: "#DCFCE7", marginTop: spacing.sm, fontSize: 14, lineHeight: 20 },
  card: {
    margin: spacing.lg,
    marginTop: -spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  roleRow: { flexDirection: "row", gap: spacing.sm },
  roleCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  err: { fontSize: 13, marginTop: spacing.md },
  submit: {
    marginTop: spacing.lg,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
