// Design tokens: Stitch palette colors and company fonts
// Extracted from globals.css and layout.tsx

export const STITCH_PALETTE = {
  // Text and foreground
  fg: "#e0e3e5",
  muted: "#909097",
  mutedHi: "#c6c6cd",

  // Background
  bg: "#101415",
  bgSoft: "#191c1e",
  bgSection: "#1d2022",
  bgElevated: "#272a2c",

  // Borders
  border: "#45464d",
  borderHi: "#323537",

  // Accent (primary brand color)
  accent: "#89ceff",
  accentDim: "rgba(137, 206, 255, 0.12)",
  accentOn: "#00344d",

  // Glass effect
  glassBg: "rgba(29, 32, 34, 0.65)",
  glassBorder: "rgba(137, 206, 255, 0.07)",
} as const;

export const COMPANY_FONTS = {
  headline: "Space Grotesk",
  body: "Inter",
} as const;

// Font weights
export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Predefined font sizes (px)
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
  "5xl": 72,
  "6xl": 96,
  "7xl": 120,
  "8xl": 144,
} as const;

// Available color options for templates (pre-curated from Stitch)
export const TEMPLATE_COLOR_OPTIONS = [
  { name: "Background", value: STITCH_PALETTE.bg },
  { name: "Text", value: STITCH_PALETTE.fg },
  { name: "Accent", value: STITCH_PALETTE.accent },
  { name: "Muted", value: STITCH_PALETTE.muted },
  { name: "Border", value: STITCH_PALETTE.border },
  { name: "Bg Elevated", value: STITCH_PALETTE.bgElevated },
] as const;

// Available fonts for templates
export const TEMPLATE_FONTS = [COMPANY_FONTS.headline, COMPANY_FONTS.body] as const;

// Helper function to get color label
export function getColorLabel(value: string): string {
  const option = TEMPLATE_COLOR_OPTIONS.find((opt) => opt.value === value);
  return option?.name || value;
}

// Helper function to validate color is from palette
export function isValidTemplateColor(color: string): boolean {
  return TEMPLATE_COLOR_OPTIONS.some((opt) => opt.value === color);
}

// Helper function to validate font is from company fonts
export function isValidTemplateFont(font: string): boolean {
  return TEMPLATE_FONTS.includes(font as any);
}
