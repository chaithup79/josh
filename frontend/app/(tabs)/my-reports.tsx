// My Reports — timeline list of user's submissions
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ListBullets, Plus } from "phosphor-react-native";
import { api, auth, Pothole, User } from "../../src/api";
import { useLiveUpdates } from "../../src/useLiveUpdates";
import { radius, spacing, STATUS_COLORS, STATUS_LABELS, useTheme } from "../../src/theme";

export default function MyReports() {
  const { t } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const statusColors = STATUS_COLORS(t);

  const load = useCallback(async () => {
    const u = await auth.getUser();
    setUser(u);
    try {
      const data = u?.role === "admin" || u?.role === "engineer"
        ? await api.listPotholes()
        : await api.listPotholes({ mine: true });
      setItems(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useLiveUpdates(
    useCallback((e) => {
      if (e.type === "pothole_created" || e.type === "status_updated" || e.type === "upvoted") {
        load();
      }
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    load();
  };

  const isStaff = user?.role === "admin" || user?.role === "engineer";

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="my-reports-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: t.surface, borderBottomColor: t.border, borderBottomWidth: 1 }}>
        <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
          <Text style={[styles.title, { color: t.onSurface }]}>
            {isStaff ? "All Reports" : "My Reports"}
          </Text>
          <Text style={{ color: t.onSurfaceSecondary, fontSize: 13, marginTop: 2 }}>
            {items.length} {items.length === 1 ? "report" : "reports"}
          </Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={t.brandPrimary} size="large" />
        </View>
      ) : items.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brandPrimary} />}
        >
          <View style={[styles.emptyIcon, { backgroundColor: t.brandTertiary }]}>
            <ListBullets size={36} color={t.brandPrimary} weight="fill" />
          </View>
          <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 18, marginTop: spacing.lg }}>
            No reports yet
          </Text>
          <Text style={{ color: t.onSurfaceSecondary, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Help keep Namma Bengaluru safe. Report your first pothole.
          </Text>
          <Pressable
            testID="empty-cta-report"
            onPress={() => router.push("/(tabs)/report")}
            style={[styles.emptyBtn, { backgroundColor: t.brandPrimary }]}
          >
            <Plus size={18} color="#fff" weight="bold" />
            <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>Report a pothole</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brandPrimary} />}
        >
          {items.map((p) => {
            const c = statusColors[p.status as keyof typeof statusColors];
            return (
              <Pressable
                key={p.id}
                testID={`my-report-${p.id}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/report/${p.id}`);
                }}
                style={[styles.card, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
              >
                {p.photo_base64 ? (
                  <Image source={{ uri: p.photo_base64 }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: t.surfaceTertiary }]} />
                )}
                <View style={{ flex: 1, padding: spacing.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ fontWeight: "700", color: t.onSurface, fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {p.road_name || "Unknown road"}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: c + "20" }]}>
                      <View style={[styles.dot, { backgroundColor: c }]} />
                      <Text style={{ color: c, fontSize: 10, fontWeight: "700" }}>
                        {STATUS_LABELS[p.status]}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                    {p.landmark || p.address || p.zone}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
                    <Text style={{ fontSize: 11, color: t.onSurfaceSecondary }}>
                      ↑ {p.upvotes}
                    </Text>
                    <Text style={{ fontSize: 11, color: t.onSurfaceSecondary, textTransform: "capitalize" }}>
                      {p.severity}
                    </Text>
                    <Text style={{ fontSize: 11, color: t.onSurfaceSecondary }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  card: {
    flexDirection: "row",
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  thumb: { width: 80, height: 80, backgroundColor: "#ddd" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: spacing.lg,
  },
});
