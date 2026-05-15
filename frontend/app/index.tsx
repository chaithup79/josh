// Splash gate: route to login or tabs based on session
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { api, auth } from "../src/api";
import { useTheme } from "../src/theme";

export default function Index() {
  const router = useRouter();
  const { t } = useTheme();

  useEffect(() => {
    (async () => {
      const user = await auth.getUser();
      setTimeout(() => {
        if (user) router.replace("/(tabs)/home");
        else router.replace("/login");
      }, 400);
    })();
  }, [router]);

  return (
    <View style={[styles.c, { backgroundColor: t.brandPrimary }]} testID="splash-screen">
      <LinearGradient
        colors={[t.brandPrimary, "#052E16"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={[styles.title, { color: t.onBrandPrimary }]}>NammaRoad</Text>
      <Text style={[styles.tag, { color: "#DCFCE7" }]}>
        Report potholes. Help fix Namma Bengaluru.
      </Text>
      <ActivityIndicator color={t.onBrandPrimary} size="large" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 44, fontWeight: "800", letterSpacing: -1 },
  tag: { fontSize: 15, marginTop: 8, opacity: 0.9 },
});
