/**
 * Resume Optimizer design tokens.
 * CSS variables in globals.css mirror these values — keep both in sync.
 */

export const colors = {
  ink: "#14151A",
  stone: "#63656E",
  mist: "#9496A0",
  canvas: "#EFEFED",
  paper: "#FFFFFF",
  line: "#D8D9DC",
  lineStrong: "#B8BAC0",
  accent: "#2A6B4F",
  accentHover: "#1F523D",
  accentMuted: "#E8F2ED",
  success: "#2A6B4F",
  successBg: "#E8F2ED",
  successBorder: "#A8D4BC",
  warning: "#7A5C1E",
  warningBg: "#F7F2E6",
  warningBorder: "#D4C49A",
  danger: "#9E2B25",
  dangerBg: "#FAEEED",
  dangerBorder: "#E4B4B0",
  previewBg: "#525659",
  previewSurface: "#E4E5E8",
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "24px",
  6: "32px",
  7: "48px",
  8: "64px",
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "20px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(20, 21, 26, 0.05)",
  md: "0 4px 16px rgba(20, 21, 26, 0.07)",
  lg: "0 12px 32px rgba(20, 21, 26, 0.1)",
} as const;

export const typography = {
  fontDisplay: 'var(--font-outfit), "Segoe UI", system-ui, sans-serif',
  fontBody: 'var(--font-plex), "Segoe UI", system-ui, sans-serif',
  sizes: {
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.9375rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
    "3xl": "2.125rem",
  },
  lineHeights: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.04em",
    caps: "0.06em",
  },
} as const;

export const layout = {
  headerHeight: "60px",
  containerMax: "1120px",
  containerWide: "1280px",
  touchTarget: "44px",
} as const;

export const motion = {
  fast: "150ms ease",
  base: "200ms ease",
  slow: "350ms ease",
} as const;

/** Inject token values as CSS custom property declarations */
export function tokensToCssVars(): Record<string, string> {
  return {
    "--color-ink": colors.ink,
    "--color-stone": colors.stone,
    "--color-mist": colors.mist,
    "--color-canvas": colors.canvas,
    "--color-paper": colors.paper,
    "--color-line": colors.line,
    "--color-line-strong": colors.lineStrong,
    "--color-accent": colors.accent,
    "--color-accent-hover": colors.accentHover,
    "--color-accent-muted": colors.accentMuted,
    "--color-success": colors.success,
    "--color-success-bg": colors.successBg,
    "--color-success-border": colors.successBorder,
    "--color-warning": colors.warning,
    "--color-warning-bg": colors.warningBg,
    "--color-warning-border": colors.warningBorder,
    "--color-danger": colors.danger,
    "--color-danger-bg": colors.dangerBg,
    "--color-danger-border": colors.dangerBorder,
    "--space-1": spacing[1],
    "--space-2": spacing[2],
    "--space-3": spacing[3],
    "--space-4": spacing[4],
    "--space-5": spacing[5],
    "--space-6": spacing[6],
    "--space-7": spacing[7],
    "--space-8": spacing[8],
    "--radius-sm": radius.sm,
    "--radius-md": radius.md,
    "--radius-lg": radius.lg,
    "--radius-xl": radius.xl,
    "--shadow-sm": shadows.sm,
    "--shadow-md": shadows.md,
    "--shadow-lg": shadows.lg,
    "--header-h": layout.headerHeight,
    "--container-max": layout.containerMax,
    "--touch-target": layout.touchTarget,
    "--transition": motion.base,
  };
}
