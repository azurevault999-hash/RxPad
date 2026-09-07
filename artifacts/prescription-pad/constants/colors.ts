/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#17212B',
    tint: '#0B8F87',

    // Core surfaces
    background: '#F4F7F6',
    foreground: '#17212B',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#17212B',

    // Primary action color (buttons, links, active states)
    primary: '#0B8F87',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E7F2F0',
    secondaryForeground: '#14504C',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E8EEED',
    mutedForeground: '#657476',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E5F4F0',
    accentForeground: '#0B716B',

    // Destructive actions (delete, error states)
    destructive: '#C94B4B',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D8E2E0',
    input: '#D8E2E0',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
