// Home / Map view — custom Bengaluru "map" with status-colored pins + filters
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { MapPin, Plus, Warning } from "phosphor-react-native";
import { api, Pothole } from "../../src/api";
import {
  radius,
  spacing,
  STATUS_COLORS,
  STATUS_LABELS,
  useTheme,
  ZONES,
} from "../../src/theme";

// Bengaluru bounding box (approx)
const BBOX = { minLat: 12.85, maxLat: 13.12, minLng: 77.45, maxLng: 77.78 };

const STATUSES = ["all", "reported", "verified", "assigned", "work_started", "fixed"] as const;

export default function Home() {
  const { t, isDark } = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<string>("all");
  const [zone, setZone] = useState<string>("all");
  const [items, setItems] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listPotholes({
        status: status !== "all" ? status : undefined,
        zone: zone !== "all" ? zone : undefined,
      });
      setItems(data);
    } catch (e) {
      // swallow
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, zone]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const statusColors = useMemo(() => STATUS_COLORS(t), [t]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="home-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: t.brandPrimary }}>
        <View style={{ padding: spacing.lg, paddingBottom: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MapPin size={22} color="#fff" weight="fill" />
            <Text style={styles.title}>Namma Bengaluru</Text>
          </View>
          <Text style={styles.subtitle}>{items.length} potholes on radar</Text>
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 8 }}
        >
          {STATUSES.map((s) => {
            const active = status === s;
            const color = s === "all" ? t.brandPrimary : statusColors[s as keyof typeof statusColors];
            return (
              <Pressable
                key={s}
                testID={`filter-status-${s}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setStatus(s);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? "#fff" : "rgba(255,255,255,0.15)",
                    borderColor: active ? "#fff" : "rgba(255,255,255,0.25)",
                  },
                ]}
              >
                {s !== "all" && (
                  <View style={[styles.chipDot, { backgroundColor: color }]} />
                )}
                <Text
                  style={{
                    color: active ? t.brandPrimary : "#fff",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Zone filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: 8 }}
        >
          {["all", ...ZONES].map((z) => {
            const active = zone === z;
            return (
              <Pressable
                key={z}
                testID={`filter-zone-${z.replace(/\s/g, "-")}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setZone(z);
                }}
                style={[
                  styles.chipSm,
                  {
                    backgroundColor: active ? "rgba(255,255,255,0.95)" : "transparent",
                    borderColor: active ? "#fff" : "rgba(255,255,255,0.3)",
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? t.brandPrimary : "#fff",
                    fontWeight: "600",
                    fontSize: 11,
                  }}
                >
                  {z === "all" ? "All Zones" : z.replace(" Zone", "")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brandPrimary} />}
      >
        {/* Map canvas */}
        <View
          testID="map-canvas"
          style={[
            styles.mapBox,
            {
              backgroundColor: isDark ? "#0F2A1E" : "#E8F5E9",
              borderColor: t.border,
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ["#0F2A1E", "#052E16"] : ["#F0FDF4", "#DCFCE7"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative road lines */}
          <View style={[styles.road, { top: "30%", backgroundColor: isDark ? "#222" : "#A3A3A3" }]} />
          <View style={[styles.road, { top: "62%", backgroundColor: isDark ? "#222" : "#A3A3A3" }]} />
          <View
            style={[
              styles.roadV,
              { left: "40%", backgroundColor: isDark ? "#222" : "#A3A3A3" },
            ]}
          />
          <View
            style={[
              styles.roadV,
              { left: "72%", backgroundColor: isDark ? "#222" : "#A3A3A3" },
            ]}
          />

          {/* Pins */}
          {loading ? (
            <ActivityIndicator
              color={t.brandPrimary}
              size="large"
              style={{ position: "absolute", top: "45%", left: "45%" }}
            />
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Warning size={32} color={t.onSurfaceSecondary} />
              <Text style={{ color: t.onSurfaceSecondary, marginTop: 8, fontSize: 13 }}>
                No potholes match this filter
              </Text>
            </View>
          ) : (
            items.map((p) => {
              const xPct =
                ((p.longitude - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100;
              const yPct =
                ((BBOX.maxLat - p.latitude) / (BBOX.maxLat - BBOX.minLat)) * 100;
              const c = statusColors[p.status as keyof typeof statusColors];
              return (
                <Pressable
                  key={p.id}
                  testID={`pin-${p.id}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/report/${p.id}`);
                  }}
                  style={[
                    styles.pinWrap,
                    {
                      left: `${Math.max(2, Math.min(94, xPct))}%`,
                      top: `${Math.max(2, Math.min(92, yPct))}%`,
                    },
                  ]}
                >
                  <View style={[styles.pin, { backgroundColor: c }]}>
                    <MapPin size={14} color="#fff" weight="fill" />
                  </View>
                  <View style={[styles.pinShadow, { backgroundColor: c, opacity: 0.3 }]} />
                </Pressable>
              );
            })
          )}

          {/* Legend */}
          <View style={[styles.legend, { backgroundColor: isDark ? "rgba(28,25,23,0.85)" : "rgba(255,255,255,0.9)" }]}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: t.onSurface, marginBottom: 4 }}>
              STATUS
            </Text>
            {(["reported", "verified", "assigned", "work_started", "fixed"] as const).map((s) => (
              <View key={s} style={{ flexDirection: "row", alignItems: "center", marginVertical: 1 }}>
                <View style={[styles.legendDot, { backgroundColor: statusColors[s] }]} />
                <Text style={{ fontSize: 10, color: t.onSurface }}>{STATUS_LABELS[s]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nearby list */}
        <Text style={[styles.sectionTitle, { color: t.onSurface }]}>Nearby Reports</Text>
        {items.slice(0, 10).map((p) => {
          const c = statusColors[p.status as keyof typeof statusColors];
          return (
            <Pressable
              key={p.id}
              testID={`nearby-card-${p.id}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/report/${p.id}`);
              }}
              style={[styles.card, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
            >
              <View style={[styles.statusBar, { backgroundColor: c }]} />
              <View style={{ flex: 1, padding: spacing.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontWeight: "700", color: t.onSurface, fontSize: 14, flex: 1 }} numberOfLines={1}>
                    {p.road_name || "Unknown road"}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: c + "20" }]}>
                    <Text style={{ color: c, fontSize: 10, fontWeight: "700" }}>
                      {STATUS_LABELS[p.status]}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                  {p.landmark ? `Near ${p.landmark} · ` : ""}{p.zone}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
                  <Text style={{ fontSize: 11, color: t.onSurfaceSecondary }}>
                    ↑ {p.upvotes} upvotes
                  </Text>
                  <Text style={{ fontSize: 11, color: t.onSurfaceSecondary, textTransform: "capitalize" }}>
                    Severity: {p.severity}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <Pressable
        testID="fab-report"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/(tabs)/report");
        }}
        style={[styles.fab, { backgroundColor: t.brandPrimary }]}
      >
        <Plus size={26} color="#fff" weight="bold" />
        <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>Report</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: "#DCFCE7", fontSize: 13, marginTop: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipSm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  mapBox: {
    height: 360,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  road: { position: "absolute", left: 0, right: 0, height: 4, opacity: 0.5 },
  roadV: { position: "absolute", top: 0, bottom: 0, width: 4, opacity: 0.5 },
  pinWrap: { position: "absolute", marginLeft: -12, marginTop: -24 },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pinShadow: { width: 16, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 2 },
  legend: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 10,
    minWidth: 92,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  empty: { position: "absolute", top: "40%", left: 0, right: 0, alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: spacing.xl, marginBottom: spacing.md, letterSpacing: -0.3 },
  card: {
    flexDirection: "row",
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  statusBar: { width: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  fab: {
    position: "absolute",
    bottom: 84,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});
