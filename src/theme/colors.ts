// ─── MedSync Color Design Tokens ─────────────────────────────────────────────
// Ported from MedSync web app index.css @theme variables
// These match the web app pixel-for-pixel

export const Colors = {
  // Primary — Blue (#005AB3)
  primary: "#005AB3",
  onPrimary: "#FFFFFF",
  primaryContainer: "#0073E0",
  onPrimaryContainer: "#FEFCFF",
  primaryFixed: "#D6E3FF",
  primaryFixedDim: "#AAC7FF",
  onPrimaryFixed: "#001B3E",
  onPrimaryFixedVariant: "#00468D",
  inversePrimary: "#AAC7FF",

  // Secondary — Green (#006E26)
  secondary: "#006E26",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#64FD7D",
  onSecondaryContainer: "#007328",
  secondaryFixed: "#6CFF82",
  secondaryFixedDim: "#47E266",
  onSecondaryFixed: "#002106",
  onSecondaryFixedVariant: "#00531A",

  // Tertiary — Indigo (#4A47D2)
  tertiary: "#4A47D2",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#6462EC",
  onTertiaryContainer: "#FFFBFF",
  tertiaryFixed: "#E2DFFF",
  tertiaryFixedDim: "#C2C1FF",
  onTertiaryFixed: "#0C006B",
  onTertiaryFixedVariant: "#332DBC",

  // Surface
  surface: "#FCF8FB",
  surfaceDim: "#DCD9DC",
  surfaceBright: "#FCF8FB",
  onSurface: "#1B1B1D",
  inverseSurface: "#303032",
  inverseOnSurface: "#F3F0F2",

  // Surface Containers
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F6F3F5",
  surfaceContainer: "#F0EDEF",
  surfaceContainerHigh: "#EAE7EA",
  surfaceContainerHighest: "#E4E2E4",

  // On Surface Variant / Outline
  onSurfaceVariant: "#414754",
  surfaceVariant: "#E4E2E4",
  outline: "#717786",
  outlineVariant: "#C0C6D6",
  surfaceTint: "#005DB8",

  // Background
  background: "#FCF8FB",
  onBackground: "#1B1B1D",

  // Error
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",
} as const;

export type ColorKey = keyof typeof Colors;
export default Colors;
