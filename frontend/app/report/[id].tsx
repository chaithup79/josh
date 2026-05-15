// Report Details — hero photo, status timeline, upvote, admin actions
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ArrowLeft, CaretRight, MapPin, ThumbsUp } from "phosphor-react-native";
import { api, auth, Pothole, StatusUpdate, User } from "../../src/api";
import { radius, spacing, STATUS_COLORS, STATUS_LABELS, SEVERITY_COLORS, useTheme } from "../../src/theme";

export default function ReportDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const router = useRouter();
  const [pothole, setPothole] = useState<Pothole | null>(null);
  const [history, setHistory] = useState<StatusUpdate[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const statusColors = STATUS_COLORS(t);
  const sevColors = SEVERITY_COLORS(t);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [p, h, u] = await Promise.all([
        api.getPothole(id),
        api.statusHistory(id),
        auth.getUser(),
      ]);
      setPothole(p);
      setHistory(h);
      setUser(u);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upvote = async () => {
    if (!pothole || voting) return;
    setVoting(true);
    try {
      const r = await api.upvote(pothole.id);
      setPothole({ ...pothole, upvotes: r.upvotes });
      Haptics.notificationAsync(
        r.already
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
      if (r.already) Alert.alert("Already upvoted", "You've already supported this report.");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={t.brandPrimary} size="large" />
      </View>
    );
  }

  if (!pothole) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Text style={{ color: t.onSurface }}>Report not found</Text>
      </View>
    );
  }

  const c = statusColors[pothole.status as keyof typeof statusColors];
  const sev = sevColors[pothole.severity];
  const isStaff = user?.role === "admin" || user?.role === "engineer";

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="report-details-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero image */}
        <View style={styles.hero}>
          {pothole.photo_base64 ? (
            <Image source={{ uri: pothole.photo_base64 }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: t.surfaceTertiary }]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.7)"]}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.4, 1]}
          />
          <SafeAreaView edges={["top"]}>
            <Pressable
              testID="back-btn"
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <ArrowLeft size={20} color="#fff" weight="bold" />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <View style={[styles.statusBadge, { backgroundColor: c }]}>
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {STATUS_LABELS[pothole.status]}
              </Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {pothole.road_name || "Unknown road"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <MapPin size={14} color="#fff" weight="fill" />
              <Text style={styles.heroSub} numberOfLines={1}>
                {pothole.landmark ? `${pothole.landmark} · ` : ""}{pothole.zone}
              </Text>
            </View>
          </View>
        </View>

        {/* Severity + meta strip */}
        <View style={{ padding: spacing.lg }}>
          <View style={[styles.metaRow, { borderColor: t.border, backgroundColor: t.surfaceSecondary }]}>
            <View style={styles.metaItem}>
              <View style={[styles.sevDot, { backgroundColor: sev }]} />
              <View>
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                  Severity
                </Text>
                <Text style={{ color: t.onSurface, fontWeight: "700", textTransform: "capitalize" }}>
                  {pothole.severity}
                </Text>
              </View>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: t.border }]} />
            <View style={styles.metaItem}>
              <View>
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                  Upvotes
                </Text>
                <Text style={{ color: t.onSurface, fontWeight: "700" }}>
                  ↑ {pothole.upvotes}
                </Text>
              </View>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: t.border }]} />
            <View style={styles.metaItem}>
              <View>
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>
                  Reported
                </Text>
                <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 12 }}>
                  {new Date(pothole.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {pothole.description ? (
            <View style={[styles.section, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}>
              <Text style={[styles.sectionLabel, { color: t.onSurfaceSecondary }]}>Description</Text>
              <Text style={{ color: t.onSurface, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                {pothole.description}
              </Text>
            </View>
          ) : null}

          {/* After photo */}
          {pothole.after_photo_base64 ? (
            <>
              <Text style={[styles.title, { color: t.onSurface }]}>After Repair</Text>
              <Image source={{ uri: pothole.after_photo_base64 }} style={styles.afterImg} />
            </>
          ) : null}

          {/* Status Timeline */}
          <Text style={[styles.title, { color: t.onSurface }]}>Status Timeline</Text>
          <View style={{ marginTop: spacing.sm }}>
            {history.map((h, idx) => {
              const tc = statusColors[h.new_status as keyof typeof statusColors] || t.brandPrimary;
              const isLast = idx === history.length - 1;
              return (
                <View key={h.id} style={styles.timelineItem}>
                  <View style={styles.timelineCol}>
                    <View style={[styles.timelineDot, { backgroundColor: tc, borderColor: t.surface }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: t.border }]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                    <Text style={{ color: t.onSurface, fontWeight: "700", fontSize: 14 }}>
                      {STATUS_LABELS[h.new_status] || h.new_status}
                    </Text>
                    <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, marginTop: 2 }}>
                      by {h.updated_by_name} · {new Date(h.timestamp).toLocaleString()}
                    </Text>
                    {h.comment ? (
                      <Text style={{ color: t.onSurface, fontSize: 13, marginTop: 6, fontStyle: "italic" }}>
                        “{h.comment}”
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={[styles.bottom, { backgroundColor: t.surface, borderTopColor: t.border }]}>
        <Pressable
          testID="upvote-btn"
          onPress={upvote}
          disabled={voting}
          style={[styles.upvoteBtn, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
        >
          <ThumbsUp size={20} color={t.brandPrimary} weight="fill" />
          <Text style={{ color: t.onSurface, fontWeight: "700", marginLeft: 8 }}>
            {pothole.upvotes}
          </Text>
        </Pressable>
        {isStaff && pothole.status !== "fixed" ? (
          <Pressable
            testID="admin-update-btn"
            onPress={() => router.push(`/admin/update/${pothole.id}`)}
            style={[styles.adminBtn, { backgroundColor: t.brandPrimary }]}
          >
            <Text style={{ color: "#fff", fontWeight: "800", marginRight: 6 }}>Update Status</Text>
            <CaretRight size={16} color="#fff" weight="bold" />
          </Pressable>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: spacing.md, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: t.onSurfaceSecondary, fontSize: 12, textAlign: "center" }}>
              {pothole.status === "fixed"
                ? "✓ Repaired by BBMP"
                : "BBMP will respond soon"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 280, position: "relative", backgroundColor: "#000" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    margin: spacing.lg,
  },
  heroBottom: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "#fff", fontSize: 13, marginLeft: 6, opacity: 0.9 },
  metaRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  metaItem: { flex: 1, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center" },
  metaDivider: { width: 1 },
  sevDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  section: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 18, fontWeight: "800", marginTop: spacing.xl, letterSpacing: -0.3 },
  afterImg: { width: "100%", height: 200, borderRadius: radius.md, marginTop: spacing.md, backgroundColor: "#000" },
  timelineItem: { flexDirection: "row" },
  timelineCol: { width: 24, alignItems: "center" },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 2, borderWidth: 3 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 24,
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  upvoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  adminBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
  },
});
