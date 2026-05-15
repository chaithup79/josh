import { Tabs } from "expo-router";
import { useTheme } from "../../src/theme";
import { MapTrifold, Plus, ListBullets, User as UserIcon } from "phosphor-react-native";
import { Platform } from "react-native";

export default function TabsLayout() {
  const { t } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.brandPrimary,
        tabBarInactiveTintColor: t.onSurfaceSecondary,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <MapTrifold size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ color, focused }) => (
            <Plus size={28} color={color} weight={focused ? "bold" : "bold"} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-reports"
        options={{
          title: "My Reports",
          tabBarIcon: ({ color, focused }) => (
            <ListBullets size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <UserIcon size={24} color={color} weight={focused ? "fill" : "regular"} />
          ),
        }}
      />
    </Tabs>
  );
}
