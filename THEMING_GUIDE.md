# Theming & Responsiveness Implementation Guide

## Overview

A comprehensive theming and responsiveness system has been implemented for the NAVY Payroll application with support for light/dark modes and mobile-first responsive design.

## Files Created/Modified

### New Files Created

1. **`public/styles/theme.css`** - Theme system with CSS variables
   - Light theme (default)
   - Dark theme (`html[data-theme="dark"]`)
   - 50+ CSS variables covering colors, shadows, transitions
   - Mobile-first responsive adjustments

2. **`public/styles/responsive-utilities.css`** - Mobile-first utility classes
   - `.text-responsive-*` - Responsive text sizing (h1, h2, h3, body)
   - `.container-*` - Responsive container padding
   - `.flex-stack` - Responsive flex layouts
   - `.grid-auto-*` - Responsive grid layouts
   - `.p-responsive`, `.m-responsive`, `.gap-responsive` - Responsive spacing
   - `.hidden-mobile`, `.hidden-desktop` - Device visibility
   - `.btn-responsive` - Responsive button sizing
   - `.table-responsive` - Responsive table handling
   - `.form-group-stack-*` - Responsive form layouts

3. **`public/script/theme-manager.js`** - Theme management script
   - Automatic initialization from localStorage
   - System preference detection
   - Theme toggle functionality
   - Custom event dispatch (`themechange`)
   - Cross-tab theme synchronization

### Modified Files

1. **`tailwind.config.js`**
   - Added `darkMode: 'class'` for Tailwind dark mode support
   - Extended colors with theme variable mappings

2. **`public/dashboard.html`**
   - Added theme CSS and script includes
   - Added theme toggle button in header
   - Added theme toggle click handler

3. **`public/styles/dashboard.css`**
   - Replaced hardcoded colors with CSS variables
   - Updated sidebar styling to use theme variables
   - Updated menu highlighting with theme colors

4. **`public/sections/payroll-calculations.html`**
   - Updated to use responsive utility classes
   - Replaced hardcoded colors with inline CSS variables
   - Added mobile-first flex/grid adjustments

## CSS Variables Reference

### Light Theme (Default)

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f7f5f1;
  --bg-tertiary: #f0ede7;

  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-tertiary: #7a7a7a;

  --color-navy: #1e40af;
  --color-warning: #f6b409;
  --color-success: #047014;
  --color-error: #dc2626;
  --color-info: #0284c7;

  --shadow-sm/md/lg/xl
  --transition-fast/normal/smooth
}
```

### Dark Theme

```css
html[data-theme="dark"] {
  --bg-primary: #0d1f35;
  --bg-secondary: #1a2b42;
  --bg-tertiary: #253551;

  --text-primary: #e8f0fe;
  --text-secondary: #b8c9e0;
  --text-tertiary: #8899b8;

  --color-navy: #60a5fa;
  --color-warning: #fbbf24;
  --color-success: #34d399;
  --color-error: #f87171;
  --color-info: #38bdf8;
}
```

## Usage Examples

### 1. Using Theme Variables in CSS

```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border-color: var(--border-primary);
  box-shadow: var(--shadow-md);
}

.my-component:hover {
  background-color: var(--bg-secondary);
}
```

### 2. Using Theme Variables in Inline Styles

```html
<div style="background-color: var(--bg-secondary); color: var(--text-primary);">
  Content
</div>
```

### 3. Using Responsive Utilities

```html
<!-- Responsive text -->
<h1 class="text-responsive-h1">Title</h1>

<!-- Responsive containers -->
<div class="container-mobile sm:container-sm md:container-md">Content</div>

<!-- Responsive flex layouts -->
<div class="flex flex-col sm:flex-row gap-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Responsive grid -->
<div class="grid-auto grid-auto-sm md:grid-auto-md gap-responsive">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Mobile-only / Desktop-only content -->
<button class="hidden-mobile">Desktop Only</button>
<button class="hidden-desktop">Mobile Only</button>

<!-- Responsive buttons -->
<button class="btn-responsive btn-primary">Click Me</button>
```

### 4. Updating Payroll Sections

Before (Hardcoded):

```html
<div class="p-6">
  <h2 class="text-2xl font-bold text-blue-800">Title</h2>
  <input class="border border-gray-300 bg-gray-100 text-gray-700" />
</div>
```

After (Theme-aware + Responsive):

```html
<div class="p-responsive">
  <h2 class="text-responsive-h2 font-bold" style="color: var(--color-navy);">
    Title
  </h2>
  <input
    class="border rounded-lg px-4 py-2"
    style="background-color: var(--bg-tertiary); 
                 color: var(--text-primary); 
                 border-color: var(--border-primary);"
  />
</div>
```

## Theme Switching

### Programmatic Theme Control

```javascript
// Get current theme
const currentTheme = themeManager.get(); // Returns 'light' or 'dark'

// Set theme
themeManager.set("light"); // Force light theme
themeManager.set("dark"); // Force dark theme
themeManager.setAuto(); // Use system preference

// Toggle theme
themeManager.toggle(); // Switch between light and dark

// Listen for theme changes
window.addEventListener("themechange", (e) => {
  console.log("Theme changed to:", e.detail.theme);
});
```

### User Interface Theme Toggle

- Click the moon/sun icon in the header to toggle theme
- Selection is saved in localStorage
- Theme persists across sessions

## Mobile-First Breakpoints

```text
Mobile (default):  < 640px
Tablet (sm):       ≥ 640px
Tablet Large (md): ≥ 768px
Desktop (lg):      ≥ 1024px
Desktop XL (xl):   ≥ 1280px
Desktop 2XL (2xl): ≥ 1536px
```

## Best Practices

### 1. Always Use Theme Variables for Colors

❌ Bad:

```css
.button {
  background-color: #1e40af;
}
```

✅ Good:

```css
.button {
  background-color: var(--color-navy);
}
```

### 2. Use Responsive Utilities Instead of Media Queries

❌ Bad:

```html
<div class="p-6 md:p-8 lg:p-10">Content</div>
```

✅ Good:

```html
<div class="p-responsive">Content</div>
```

### 3. Use Semantic HTML with Theme Variables

```html
<button class="btn-primary">Success</button>
<button class="btn-success">Confirm</button>
<button class="btn-warning">Alert</button>
<button class="btn-error">Delete</button>
```

### 4. Mobile-First Development

- Start with mobile styles
- Enhance for larger screens
- Use breakpoints for modifications

```html
<!-- Mobile: single column; sm+: two columns; lg+: three columns -->
<div class="grid-auto grid-auto-sm md:grid-auto-md gap-responsive">...</div>
```

## Updating Existing Payroll Sections

To apply theming to payroll sections:

1. **Replace hardcoded padding**

   ```html
   <!-- Before -->
   <div class="p-6 md:p-8">
     <!-- After -->
     <div class="p-responsive"></div>
   </div>
   ```

2. **Replace hardcoded colors with CSS variables**

   ```html
   <!-- Before -->
   <div style="background: white; color: black;">
     <!-- After -->
     <div
       style="background-color: var(--bg-primary); color: var(--text-primary);"
     ></div>
   </div>
   ```

3. **Use responsive text sizing**

   ```html
   <!-- Before -->
   <h2 class="text-2xl md:text-3xl">
     <!-- After -->
     <h2 class="text-responsive-h2"></h2>
   </h2>
   ```

4. **Use responsive layouts**

   ```html
   <!-- Before -->
   <div class="flex flex-col md:flex-row gap-4">
     <!-- After -->
     <div class="flex-stack flex-stack-sm"></div>
   </div>
   ```

5. **Use responsive spacing**

   ```html
   <!-- Before -->
   <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     <!-- After -->
     <div class="grid-auto grid-auto-sm md:grid-auto-md gap-responsive"></div>
   </div>
   ```

## Testing Theme Switching

1. Open DevTools (F12)
2. Click theme toggle button in header (moon/sun icon)
3. Verify:
   - Colors change appropriately
   - Layout remains responsive
   - Icons switch (moon ↔ sun)
   - Setting persists on page reload

## Accessibility Considerations

### Prefers Color Scheme

The system respects `prefers-color-scheme` media query for system dark/light mode preferences.

### Reduced Motion

Animations disabled for users with `prefers-reduced-motion: reduce` setting.

### High Contrast

Status colors (success, warning, error, info) maintain sufficient contrast in both themes.

### Touch Targets

All interactive elements maintain minimum 48x48px size on mobile.

## Next Steps

1. **Update remaining payroll sections** (80+ files in `/sections/`) to use theme variables
2. **Add user theme preference** to database/user settings
3. **Extend theme customization** (allow users to customize colors)
4. **Add theme preview** in settings page
5. **Test across browsers** (Chrome, Firefox, Safari, Edge)

## Troubleshooting

### Theme not switching?

- Check browser localStorage: `localStorage.getItem('navy-payroll-theme')`
- Verify `theme-manager.js` is loaded
- Check browser console for errors

### Responsive classes not working?

- Ensure `responsive-utilities.css` is loaded before component CSS
- Check for conflicting Tailwind classes
- Verify breakpoint in use (test with DevTools responsive mode)

### Colors look wrong?

- Verify CSS variables are defined in `theme.css`
- Check for inline styles overriding variables
- Test in both light and dark themes

## Support

For issues or questions, refer to:

- `public/styles/theme.css` - Theme variable definitions
- `public/styles/responsive-utilities.css` - Responsive utilities
- `public/script/theme-manager.js` - Theme switching logic
