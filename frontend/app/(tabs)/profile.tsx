// Profile + BBMP admin dashboard (analytics + role-based actions)
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ChartBar, CheckCircle, Clock, SignOut, User as UserIcon, Wrench } from "phosphor-react-native";
import { api, auth, User } from "../../src/api";
import { useLiveUpdates } from "../../src/useLiveUpdates";
import { radius, spacing, STATUS_COLORS, STATUS_LABELS, useTheme } from "../../src/theme";

export default function Profile() {
  const { t } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const u = await auth.getUser();
    setUser(u);
    try {
      const s = await api.analytics();
      setStats(s);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useLiveUpdates(
    useCallback((e) => {
      if (e.type === "pothole_created" || e.type === "status_updated") {
        load();
      }
    }, [load])
  );

  const signOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await auth.signOut();
    router.replace("/login");
  };

  const isStaff = user?.role === "admin" || user?.role === "engineer";
  const statusColors = STATUS_COLORS(t);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={t.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="profile-screen">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={t.brandPrimary}
          />
        }
      >
        <LinearGradient
          colors={[t.brandPrimary, "#052E16"]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView edges={["top"]}>
            <View style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
              <View style={styles.avatar}>
                {isStaff ? (
                  user?.role === "admin" ? (
                    <ChartBar size={32} color="#fff" weight="fill" />
                  ) : (
                    <Wrench size={32} color="#fff" weight="fill" />
                  )
                ) : (
                  <UserIcon size={32} color="#fff" weight="fill" />
                )}
              </View>
              <Text style={styles.name} testID="profile-name">{user?.name}</Text>
              <View style={styles.roleBadge}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {user?.role === "admin" ? "BBMP Admin" : user?.role === "engineer" ? "BBMP Engineer" : "Citizen"}
                </Text>
              </View>
              <Text style={{ color: "#DCFCE7", fontSize: 13, marginTop: 6 }}>{user?.phone}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ padding: spacing.lg, marginTop: -spacing.xl }}>
          {/* Top stat tiles */}
          {stats && (
            <View style={[styles.statsCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={styles.statRow}>
                <View style={styles.statTile}>
                  <Text style={[styles.statNum, { color: t.onSurface }]}>{stats.total}</Text>
                  <Text style={[styles.statLbl, { color: t.onSurfaceSecondary }]}>Total</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: t.border }]} />
                <View style={styles.statTile}>
                  <Text style={[styles.statNum, { color: t.success }]}>{stats.fixed}</Text>
                  <Text style={[styles.statLbl, { color: t.onSurfaceSecondary }]}>Fixed</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: t.border }]} />
                <View style={styles.statTile}>
                  <Text style={[styles.statNum, { color: t.statusOrange }]}>{stats.pending}</Text>
                  <Text style={[styles.statLbl, { color: t.onSurfaceSecondary }]}>Pending</Text>
                </View>
              </View>
              <View style={[styles.rateBar, { backgroundColor: t.surfaceSecondary }]}>
                <View
                  style={{
                    height: 8,
                    width: `${stats.fix_rate}%`,
                    backgroundColor: t.success,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 6, textAlign: "center" }}>
                {stats.fix_rate}% fix rate
              </Text>
            </View>
          )}

          {/* Status breakdown */}
          {stats && (
            <>
              <Text style={[styles.sectionTitle, { color: t.onSurface }]}>By Status</Text>
              <View style={[styles.card, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
                {(["reported", "verified", "assigned", "work_started", "fixed"] as const).map((s) => (
                  <View key={s} style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />
                    <Text style={{ color: t.onSurface, fontSize: 14, flex: 1 }}>{STATUS_LABELS[s]}</Text>
                    <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>
                      {stats.by_status[s] || 0}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Zone breakdown */}
          {stats?.zone_stats && (
            <>
              <Text style={[styles.sectionTitle, { color: t.onSurface }]}>By Zone</Text>
              <View style={[styles.card, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
                {stats.zone_stats
                  .filter((z: any) => z.total > 0)
                  .map((z: any) => (
                    <View key={z.zone} style={styles.zoneRow}>
                      <Text style={{ color: t.onSurface, fontSize: 13, flex: 1, fontWeight: "600" }}>
                        {z.zone}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={[styles.miniPill, { backgroundColor: t.statusOrange + "20" }]}>
                          <Clock size={11} color={t.statusOrange} weight="fill" />
                          <Text style={{ color: t.statusOrange, fontSize: 11, fontWeight: "700" }}>
                            {z.pending}
                          </Text>
                        </View>
                        <View style={[styles.miniPill, { backgroundColor: t.success + "20" }]}>
                          <CheckCircle size={11} color={t.success} weight="fill" />
                          <Text style={{ color: t.success, fontSize: 11, fontWeight: "700" }}>
                            {z.fixed}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
              </View>
            </>
          )}

          {/* Admin quick actions */}
          {isStaff && (
            <>
              <Text style={[styles.sectionTitle, { color: t.onSurface }]}>BBMP Actions</Text>
              <Pressable
                testID="admin-pending-action"
                onPress={() => router.push("/(tabs)/my-reports")}
                style={[styles.actionCard, { backgroundColor: t.brandPrimary }]}
              >
                <ChartBar size={22} color="#fff" weight="fill" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                    Pending Reports Queue
                  </Text>
                  <Text style={{ color: "#DCFCE7", fontSize: 12 }}>
                    Tap to triage & assign
                  </Text>
                </View>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
                  {stats?.pending || 0}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            testID="sign-out"
            onPress={signOut}
            style={[styles.signOut, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
          >
            <SignOut size={20} color={t.error} weight="bold" />
            <Text style={{ color: t.error, fontWeight: "700", marginLeft: 8 }}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {},
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  name: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 8,
  },
  statsCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statRow: { flexDirection: "row", alignItems: "center" },
  statTile: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  statLbl: { fontSize: 11, marginTop: 2, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  divider: { width: 1, height: 36 },
  rateBar: { height: 8, borderRadius: 4, marginTop: spacing.md, overflow: "hidden" },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: spacing.xl, marginBottom: spacing.sm, letterSpacing: -0.3 },
  card: { borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  statusRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  zoneRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  miniPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, gap: 4 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
});
