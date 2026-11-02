// ─── MedSync Spacing & Typography Tokens ─────────────────────────────────────

export const Spacing = {
  xs: 8,    // --spacing-space-xs
  sm: 16,   // --spacing-space-sm
  md: 24,   // --spacing-space-md
  lg: 36,   // --spacing-space-lg
  xl: 48,   // --spacing-space-xl
  xxl: 64,  // --spacing-space-xxl
  margin: 24, // --spacing-margin
  gutter: 20, // --spacing-gutter
  safe: 32, // --spacing-safe
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const FontSize = {
  // Headline
  headlineXl: 32,
  headlineLg: 28,
  headlineMd: 24,
  headlineSm: 20,
  // Body
  bodyLg: 16,
  bodyMd: 14,
  bodySm: 12,
  // Label
  labelLg: 14,
  labelMd: 12,
  // Data
  dataMono: 11,
  dataMetric: 16,
} as const;

export const FontFamily = {
  headlineBold: "PlusJakartaSans_700Bold",
  headlineSemiBold: "PlusJakartaSans_600SemiBold",
  headlineMedium: "PlusJakartaSans_500Medium",
  bodyRegular: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  dataMono: "JetBrainsMono_400Regular",
  dataMonoBold: "JetBrainsMono_700Bold",
} as const;
