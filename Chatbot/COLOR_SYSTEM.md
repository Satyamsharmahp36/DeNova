# DeNova Color System

## Design Philosophy
Minimalist, professional design with strategic use of color. Avoid generic AI-generated aesthetics.

## Color Palette

### Primary Accent
- **Emerald**: Used sparingly for active states, success, and key CTAs
  - `emerald-400`: Subtle accents, icons
  - `emerald-500`: Primary actions, borders
  - `emerald-600`: Hover states

### Secondary Accent
- **Red**: Used only for destructive actions and errors
  - `red-400`: Error text, destructive hover
  - `red-500`: Error states
  - `red-600`: Destructive actions

### Neutrals (Dark Mode)
- **Backgrounds**:
  - `gray-950`: Main background
  - `gray-900`: Secondary background, cards
  - `gray-800`: Elevated surfaces, active states
  - `gray-700`: Borders, subtle dividers

- **Text**:
  - `white`: Primary text
  - `gray-300`: Secondary text
  - `gray-400`: Tertiary text, placeholders
  - `gray-500`: Disabled text, subtle labels

### Semantic Colors
- **Success**: `green-500`, `green-600`
- **Warning**: `yellow-500`, `yellow-600`
- **Error**: `red-500`, `red-600`
- **Info**: `gray-400` (no blue)

## Usage Guidelines

### Active States
- Use `bg-gray-800` with `border border-emerald-500/30`
- Avoid solid color backgrounds except for CTAs

### Hover States
- Use `hover:bg-gray-800/50` for subtle interactions
- Use `hover:border-gray-600` for bordered elements

### Icons
- Default: `text-gray-400`
- Active: `text-white` or `text-emerald-400`
- Brand-specific: Keep minimal (e.g., WhatsApp green, but muted)

### Buttons
- Primary: `bg-gray-800 border border-emerald-500/30 hover:bg-gray-700`
- Secondary: `bg-gray-800 border border-gray-700 hover:bg-gray-700`
- Destructive: `bg-red-600 hover:bg-red-500`

## What to Avoid
- ❌ Neon blue (`bg-blue-600`, `shadow-blue-600/20`)
- ❌ Multiple bright accent colors
- ❌ Gradient backgrounds on buttons
- ❌ Colorful avatar backgrounds (use gray variations)
- ❌ Heavy shadows with color tints

## Migration Checklist
- [ ] Replace all `bg-blue-*` with appropriate gray or emerald
- [ ] Replace all `text-blue-*` with `text-emerald-*` or `text-gray-*`
- [ ] Replace all `border-blue-*` with `border-emerald-*` or `border-gray-*`
- [ ] Update avatar color system to use gray variations
- [ ] Remove colored shadows (`shadow-blue-600/20` → remove or use `shadow-lg`)
