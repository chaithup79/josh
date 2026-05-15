// Report pothole — one-hand form
import { useState } from "react";
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
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Camera, ImageSquare, MapPin, Check } from "phosphor-react-native";
import { api } from "../../src/api";
import { radius, SEVERITY_COLORS, spacing, useTheme, ZONES } from "../../src/theme";

const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export default function Report() {
  const { t } = useTheme();
  const router = useRouter();
  const sevColors = SEVERITY_COLORS(t);

  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState<string>("South Zone");
  const [wardName, setWardName] = useState("");
  const [roadName, setRoadName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission denied", "Camera access is required to capture potholes");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      base64: true,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const pickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.4,
      base64: true,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets[0]?.base64) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const detectLocation = async () => {
    setLocLoading(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        // Fallback: pick a Bengaluru centroid
        setCoords({ lat: 12.9716, lng: 77.5946 });
        setAddress("Bengaluru, Karnataka");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setCoords({ lat, lng });
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (places[0]) {
          const p = places[0];
          setAddress(`${p.street || ""}, ${p.district || p.city || ""}`.trim());
        }
      } catch {}
      Haptics.selectionAsync();
    } catch {
      setCoords({ lat: 12.9716, lng: 77.5946 });
      setAddress("Bengaluru (default)");
    } finally {
      setLocLoading(false);
    }
  };

  const submit = async () => {
    if (!photo) {
      Alert.alert("Photo required", "Please capture or upload a pothole photo");
      return;
    }
    if (!coords) {
      Alert.alert("Location required", "Please detect your GPS location");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createPothole({
        photo_base64: photo,
        latitude: coords.lat,
        longitude: coords.lng,
        address,
        zone,
        ward_name: wardName,
        road_name: roadName,
        landmark,
        severity,
        description,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Reported!", "Thanks. BBMP will review your report.", [
        {
          text: "View",
          onPress: () => router.replace(`/report/${created.id}`),
        },
        {
          text: "Done",
          onPress: () => {
            // reset
            setPhoto(null);
            setCoords(null);
            setAddress("");
            setRoadName("");
            setLandmark("");
            setDescription("");
            router.replace("/(tabs)/home");
          },
        },
      ]);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", e?.message || "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }} testID="report-screen">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: t.brandPrimary }}>
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.title}>Report a pothole</Text>
          <Text style={styles.subtitle}>Snap. Tap. Done.</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
          {/* Photo */}
          <Text style={[styles.label, { color: t.onSurface }]}>Photo</Text>
          {photo ? (
            <View style={{ position: "relative" }}>
              <Image source={{ uri: photo }} style={styles.photoPreview} />
              <Pressable
                testID="retake-photo"
                onPress={() => setPhoto(null)}
                style={[styles.retake, { backgroundColor: t.surfaceInverse }]}
              >
                <Text style={{ color: t.onSurfaceInverse, fontWeight: "600", fontSize: 12 }}>Retake</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                testID="take-photo-btn"
                onPress={takePhoto}
                style={[styles.photoBtn, { backgroundColor: t.brandTertiary, borderColor: t.brandPrimary }]}
              >
                <Camera size={28} color={t.brandPrimary} weight="fill" />
                <Text style={{ color: t.onBrandTertiary, fontWeight: "700", marginTop: 6 }}>Camera</Text>
              </Pressable>
              <Pressable
                testID="gallery-btn"
                onPress={pickGallery}
                style={[styles.photoBtn, { backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
              >
                <ImageSquare size={28} color={t.onSurface} weight="fill" />
                <Text style={{ color: t.onSurface, fontWeight: "700", marginTop: 6 }}>Gallery</Text>
              </Pressable>
            </View>
          )}

          {/* Location */}
          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>Location</Text>
          <Pressable
            testID="detect-location-btn"
            onPress={detectLocation}
            style={[styles.locBtn, { backgroundColor: coords ? t.brandSecondary : t.surfaceSecondary, borderColor: t.border }]}
          >
            <MapPin size={22} color={coords ? t.onBrandSecondary : t.onSurfaceSecondary} weight="fill" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              {locLoading ? (
                <ActivityIndicator color={t.brandPrimary} />
              ) : coords ? (
                <>
                  <Text style={{ color: t.onBrandSecondary, fontWeight: "700", fontSize: 13 }}>
                    {address || "Location captured"}
                  </Text>
                  <Text style={{ color: t.onBrandSecondary, fontSize: 11, marginTop: 2 }}>
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </Text>
                </>
              ) : (
                <Text style={{ color: t.onSurfaceSecondary, fontSize: 13 }}>Tap to auto-detect</Text>
              )}
            </View>
            {coords && <Check size={20} color={t.brandPrimary} weight="bold" />}
          </Pressable>

          {/* Zone */}
          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>BBMP Zone</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {ZONES.map((z) => {
              const active = zone === z;
              return (
                <Pressable
                  key={z}
                  testID={`zone-${z.replace(/\s/g, "-")}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setZone(z);
                  }}
                  style={[
                    styles.zoneChip,
                    {
                      backgroundColor: active ? t.brandPrimary : t.surfaceSecondary,
                      borderColor: active ? t.brandPrimary : t.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? "#fff" : t.onSurface, fontWeight: "600", fontSize: 12 }}>
                    {z.replace(" Zone", "")}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Severity */}
          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>Severity</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {SEVERITIES.map((s) => {
              const active = severity === s;
              const c = sevColors[s];
              return (
                <Pressable
                  key={s}
                  testID={`severity-${s}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSeverity(s);
                  }}
                  style={[
                    styles.sevBtn,
                    {
                      backgroundColor: active ? c : t.surfaceSecondary,
                      borderColor: active ? c : t.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? "#fff" : t.onSurface,
                      fontWeight: "700",
                      textTransform: "capitalize",
                      fontSize: 12,
                    }}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Road / Landmark */}
          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.lg }]}>Road name</Text>
          <TextInput
            testID="road-name-input"
            value={roadName}
            onChangeText={setRoadName}
            placeholder="e.g. MG Road"
            placeholderTextColor={t.onSurfaceSecondary}
            style={[styles.input, { color: t.onSurface, backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
          />

          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.md }]}>Nearby landmark</Text>
          <TextInput
            testID="landmark-input"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Near Forum Mall"
            placeholderTextColor={t.onSurfaceSecondary}
            style={[styles.input, { color: t.onSurface, backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
          />

          <Text style={[styles.label, { color: t.onSurface, marginTop: spacing.md }]}>Description (optional)</Text>
          <TextInput
            testID="description-input"
            value={description}
            onChangeText={setDescription}
            placeholder="Width, depth, traffic impact..."
            placeholderTextColor={t.onSurfaceSecondary}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea, { color: t.onSurface, backgroundColor: t.surfaceSecondary, borderColor: t.border }]}
          />
        </ScrollView>

        {/* Sticky submit */}
        <View style={[styles.stickyBar, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <Pressable
            testID="submit-report"
            onPress={submit}
            disabled={submitting || !photo || !coords}
            style={[
              styles.submit,
              {
                backgroundColor: !photo || !coords ? t.surfaceTertiary : t.brandPrimary,
                opacity: submitting ? 0.6 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                Submit to BBMP
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#DCFCE7", fontSize: 13, marginTop: 2 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  photoBtn: {
    flex: 1,
    paddingVertical: 22,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
  },
  photoPreview: { width: "100%", height: 200, borderRadius: radius.md, backgroundColor: "#000" },
  retake: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  locBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  zoneChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  sevBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 28 : spacing.lg,
    borderTopWidth: 1,
  },
  submit: {
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
});
