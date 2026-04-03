# 🎨 Official UI Theme System

**Design Philosophy:** Cinematic Institutional AI Terminal

> This is NOT a flat dark UI. This is a premium, cinematic interface for professional algorithmic trading with AI-powered intelligence.

---

## 1️⃣ CORE COLOR SYSTEM

### 🎨 Primary Brand Colors

| Role | Color | Usage |
|------|-------|-------|
| **Primary Accent** | `#FE7F2D` | CTA buttons, active states, highlights |
| **Primary Dark** | `#E56F24` | Hover state |
| **Background Base** | `#212223` | Page background |
| **Surface Card** | `#2A2B2C` | Cards, panels |
| **Elevated Surface** | `#323334` | Modals, dropdowns |
| **Border** | `rgba(255,255,255,0.08)` | Subtle borders |

### 📝 Text System

| Type | Color |
|------|-------|
| **Primary Text** | `#FFFFFF` |
| **Secondary Text** | `#A0A0A0` |
| **Muted Text** | `#6B6B6B` |
| **Accent Text** | `#FE7F2D` |

### 📊 Status Colors (For Backtesting + Validation)

| Status | Color |
|--------|-------|
| **Profit / Success** | `#10B981` |
| **Warning** | `#F59E0B` |
| **Error / Loss** | `#EF4444` |
| **Info** | `#3B82F6` |

> [!IMPORTANT]
> **Flame is NEVER used for errors.**
> 
> Flame = action, intelligence, decision.

---

## 2️⃣ BACKGROUND SYSTEM

### 🌌 Global Background Style

**Base:** `#212223`

**Overlay:**
- Subtle radial flame glow (top left)
- Very low opacity grid texture
- 3% noise texture

> [!WARNING]
> **Flame glow should ONLY appear in:**
> - Hero section
> - AI Builder screen
> - Active focus panels
> 
> **Never everywhere.**

---

## 3️⃣ IMPLEMENTATION GUIDE

### Tailwind CSS Variables

Add these to your `tailwind.config.js`:

```javascript
colors: {
  flame: {
    DEFAULT: '#FE7F2D',
    dark: '#E56F24',
  },
  background: {
    base: '#212223',
    card: '#2A2B2C',
    elevated: '#323334',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    muted: '#6B6B6B',
    accent: '#FE7F2D',
  },
  status: {
    profit: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
}
```

### Global CSS Styles

Add to `src/index.css`:

```css
body {
  background: #212223;
  position: relative;
  overflow-x: hidden;
}

/* Cinematic background with subtle effects */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  
  /* Subtle grid texture */
  background-image: 
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  
  /* 3% noise texture */
  opacity: 0.03;
}
```

### Flame Glow Effect (Hero/AI Builder Only)

```css
.flame-glow {
  position: relative;
}

.flame-glow::before {
  content: '';
  position: absolute;
  top: -200px;
  left: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(254, 127, 45, 0.15) 0%,
    rgba(254, 127, 45, 0.05) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: -1;
}
```

---

## 4️⃣ COMPONENT USAGE EXAMPLES

### Primary CTA Button

```tsx
<Button className="bg-flame hover:bg-flame-dark">
  Start Building Strategies
</Button>
```

### Card Component

```tsx
<div className="bg-background-card border border-white/[0.08] rounded-lg p-6">
  {/* Card content */}
</div>
```

### Status Indicators

```tsx
// Profit
<span className="text-status-profit">+12.5%</span>

// Warning
<span className="text-status-warning">Validation Required</span>

// Error
<span className="text-status-error">Strategy Failed</span>

// Info
<span className="text-status-info">Backtesting...</span>
```

### Text Hierarchy

```tsx
<h1 className="text-text-primary">Main Heading</h1>
<p className="text-text-secondary">Secondary information</p>
<span className="text-text-muted">Helper text</span>
<a className="text-text-accent">Action link</a>
```

---

## 5️⃣ DESIGN PRINCIPLES

### ✅ DO

- Use flame color (`#FE7F2D`) for primary actions and AI-powered features
- Apply subtle flame glow to hero sections and AI builder screens
- Use status colors appropriately (green = profit, red = loss)
- Maintain high contrast for readability
- Use elevated surfaces for modals and dropdowns
- Apply subtle borders with `rgba(255,255,255,0.08)`

### ❌ DON'T

- Use flame color for errors or warnings
- Apply flame glow everywhere (only hero, AI builder, active panels)
- Use flat backgrounds without texture
- Mix status colors incorrectly
- Use low contrast text combinations
- Overuse bright colors

---

## 6️⃣ ACCESSIBILITY

- **Contrast Ratios:** All text meets WCAG AA standards
- **Focus States:** Flame color with reduced opacity for focus rings
- **Status Colors:** Never rely on color alone; use icons + text
- **Dark Mode:** This IS the dark mode (no light mode variant)

---

## 7️⃣ ANIMATION GUIDELINES

### Micro-interactions

- **Hover transitions:** 200ms ease
- **Button press:** Scale 0.98 with 100ms duration
- **Card elevation:** Smooth shadow transition on hover
- **Flame glow:** Subtle pulse animation (optional, use sparingly)

### Page Transitions

- **Fade in:** 300ms ease-out
- **Slide up:** 400ms ease-out with 20px offset
- **Stagger:** 50ms delay between sequential elements

---

## 8️⃣ TYPOGRAPHY

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Size Scale

| Element | Size | Weight |
|---------|------|--------|
| Hero Title | 72px | 700 |
| H1 | 48px | 600 |
| H2 | 36px | 600 |
| H3 | 24px | 600 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 400 |

---

## 9️⃣ SPACING SYSTEM

Use Tailwind's default spacing scale:

- `4px` - Tight spacing
- `8px` - Default spacing
- `16px` - Medium spacing
- `24px` - Large spacing
- `32px` - XL spacing
- `48px` - 2XL spacing

---

## 🔟 ELEVATION SYSTEM

| Level | Shadow | Usage |
|-------|--------|-------|
| **Base** | None | Page background |
| **Card** | `0 1px 3px rgba(0,0,0,0.3)` | Cards, panels |
| **Elevated** | `0 4px 12px rgba(0,0,0,0.4)` | Modals, dropdowns |
| **Floating** | `0 8px 24px rgba(0,0,0,0.5)` | Tooltips, popovers |

---

## Summary

This theme creates a **premium, cinematic experience** for professional traders:

- 🔥 Flame accent represents AI intelligence and action
- 🌌 Cinematic backgrounds with subtle textures
- 📊 Clear status indicators for trading metrics
- ⚡ Smooth animations and micro-interactions
- 🎯 High contrast for data-heavy interfaces

**Remember:** You're building an institutional-grade AI trading terminal, not a consumer app.
