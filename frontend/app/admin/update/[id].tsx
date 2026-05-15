// Admin status update flow
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Camera, Check } from "phosphor-react-native";
import { api, auth, Pothole } from "../../../src/api";
import { radius, spacing, STATUS_COLORS, STATUS_LABELS, useTheme } from "../../../src/theme";

const STATUSES = ["verified", "assigned", "work_started", "fixed"] as const;

export default function AdminUpdate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const router = useRouter();
  const [pothole, setPothole] = useState<Pothole | null>(null);
  const [newStatus, setNewStatus] = useState<string>("verified");
  const [comment, setComment] = useState("");
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const statusColors = STATUS_COLORS(t);

  useEffect(() => {
    (async () => {
      const u = await auth.getUser();
      if (!u || (u.role !== "admin" && u.role !== "engineer")) {
        Alert.alert("Access denied", "Only BBMP staff can update status");
        router.back();
        return;
      }
      if (id) {
        try {
          const p = await api.getPothole(id);
          setPothole(p);
          // Suggest next status
          const order = ["reported", "verified", "assigned", "work_started", "fixed"];
          const idx = order.indexOf(p.status);
          if (idx >= 0 && idx < order.length - 1) {
            setNewStatus(order[idx + 1]);
          }
        } catch (e: any) {
          Alert.alert("Error", e?.message);
        }
      }
      setLoading(false);
    })();
  }, [id, router]);

  const pickAfterPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      base64: true,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAfterPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const takeAfterPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission denied", "Camera access is required");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      base64: true,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAfterPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const submit = async () => {
    if (!pothole) return;
    setSubmitting(true);
    try {
      await api.updateStatus(pothole.id, {
        new_status: newStatus,
        comment,
        after_photo_base64: afterPhoto || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Updated", `Status changed to ${STATUS_LABELS[newStatus]}`, [
        { text: "OK", onPress: () => router.replace(`/report/${pothole.id}`) },
      ]);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={t.brandPrimary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="admin-update-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: t.brandPrimary }}>
        <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.lg }}>
          <Pressable testID="admin-back" onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={20} color="#fff" weight="bold" />
          </Pressable>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Update Status</Text>
            <Text style={{ color: "#DCFCE7", fontSize: 12, marginTop: 2 }}>
              Current: {STATUS_LABELS[pothole?.status || "reported"]}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
          <Text style={[styles.label, { color: t.onSurface }]}>New status</Text>
          <View style={{ gap: spacing.sm }}>
            {STATUSES.map((s) => {
              const active = newStatus === s;
              const c = statusColors[s];
              return (
                <Pressable
                  key={s}
                  testID={`status-option-${s}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setNewStatus(s);
                  }}
                  style={[
                    styles.statusOpt,
                    {
                      backgroundColor: active ? c + "20" : t.surfaceSecondary,
                      borderColor: active ? c : t.border,
                    },
                  ]}
                >
                  <View style={[styles.statusDot, { backgroundColor: c }]} />
                  <Text style={{ color: t.onSurface, fontWeight: "700", flex: 1 }}>
                    {STATUS_LABELS[s]}
                  </Text>
                  {active && <Check size={20} color={c} weight="bold" />}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>
            Comment (optional)
          </Text>
          <TextInput
            testID="admin-comment"
            value={comment}
            onChangeText={setComment}
            placeholder="Notes for the citizen..."
            placeholderTextColor={t.onSurfaceSecondary}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              { color: t.onSurface, backgroundColor: t.surfaceSecondary, borderColor: t.border, minHeight: 80, textAlignVertical: "top" },
            ]}
          />

          {newStatus === "fixed" && (
            <>
              <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>
                After-repair photo
              </Text>
              {afterPhoto ? (
                <View style={{ position: "relative" }}>
                  <Image source={{ uri: afterPhoto }} style={styles.afterPreview} />
                  <Pressable onPress={() => setAfterPhoto(null)} style={[styles.retake, { backgroundColor: t.surfaceInverse }]}>
                    <Text style={{ color: t.onSurfaceInverse, fontSize: 12, fontWeight: "600" }}>Retake</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Pressable
                    testID="after-photo-camera"
                    onPress={takeAfterPhoto}
                    style={[styles.afterBtn, { backgroundColor: t.brandTertiary, borderColor: t.brandPrimary }]}
                  >
                    <Camera size={24} color={t.brandPrimary} weight="fill" />
                    <Text style={{ color: t.onBrandTertiary, fontWeight: "700", marginTop: 4 }}>Camera</Text>
                  </Pressable>
                  <Pressable
                    testID="after-photo-gallery"
                    onPress={pickAfterPhoto}
                    style={[styles.afterBtn, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
                  >
                    <Text style={{ color: t.onSurface, fontWeight: "700" }}>Gallery</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.bottom, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Pressable
            testID="admin-submit"
            onPress={submit}
            disabled={submitting}
            style={[styles.submit, { backgroundColor: t.brandPrimary, opacity: submitting ? 0.6 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                Confirm Update
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  statusOpt: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: 10,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  afterPreview: { width: "100%", height: 180, borderRadius: radius.md, backgroundColor: "#000" },
  retake: { position: "absolute", top: 8, right: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  afterBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  submit: {
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
});
