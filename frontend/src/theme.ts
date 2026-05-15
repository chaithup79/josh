// NammaRoad theme — extracted from design_guidelines.json
import { useColorScheme } from "react-native";

export const lightTheme = {
  surface: "#FFFFFF",
  onSurface: "#1C1917",
  surfaceSecondary: "#F5F5F4",
  onSurfaceSecondary: "#44403C",
  surfaceTertiary: "#E7E7E4",
  onSurfaceTertiary: "#292524",
  surfaceInverse: "#1C1917",
  onSurfaceInverse: "#FFFFFF",
  brand: "#166534",
  brandPrimary: "#166534",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#DCFCE7",
  onBrandSecondary: "#14532D",
  brandTertiary: "#F0FDF4",
  onBrandTertiary: "#166534",
  success: "#16A34A",
  warning: "#EAB308",
  error: "#DC2626",
  info: "#2563EB",
  statusOrange: "#EA580C",
  border: "#E5E5E5",
  borderStrong: "#A3A3A3",
  divider: "#E5E5E5",
};

export const darkTheme = {
  surface: "#1C1917",
  onSurface: "#FAFAF9",
  surfaceSecondary: "#292524",
  onSurfaceSecondary: "#F5F5F4",
  surfaceTertiary: "#44403C",
  onSurfaceTertiary: "#E7E7E4",
  surfaceInverse: "#FAFAF9",
  onSurfaceInverse: "#1C1917",
  brand: "#22C55E",
  brandPrimary: "#22C55E",
  onBrandPrimary: "#052E16",
  brandSecondary: "#14532D",
  onBrandSecondary: "#DCFCE7",
  brandTertiary: "#052E16",
  onBrandTertiary: "#4ADE80",
  success: "#22C55E",
  warning: "#FACC15",
  error: "#EF4444",
  info: "#3B82F6",
  statusOrange: "#F97316",
  border: "#404040",
  borderStrong: "#737373",
  divider: "#404040",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

// Status color mapping per design guidelines
export const STATUS_COLORS = (t: typeof lightTheme) => ({
  reported: t.error,
  verified: t.statusOrange,
  assigned: t.warning,
  work_started: t.info,
  fixed: t.success,
});

export const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  verified: "Verified",
  assigned: "Assigned",
  work_started: "In Progress",
  fixed: "Fixed",
};

export const SEVERITY_COLORS = (t: typeof lightTheme) => ({
  low: t.success,
  medium: t.warning,
  high: t.statusOrange,
  critical: t.error,
});

export const ZONES = [
  "East Zone",
  "West Zone",
  "South Zone",
  "Mahadevapura Zone",
  "Bommanahalli Zone",
  "RR Nagar Zone",
  "Dasarahalli Zone",
  "Yelahanka Zone",
];

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const t = isDark ? darkTheme : lightTheme;
  return { t, isDark };
}
