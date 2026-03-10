import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // We keep a 'brand' color palette for deep custom styling outside of DaisyUI components
      colors: {
        brand: { 
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        }
      }
    },
  },
  plugins: [
    // This tells DaisyUI to use our custom 'dormfix' theme instead of the default ones
    require("daisyui")({
      themes: [
        {
          dormfix: {
            "primary": "#4f46e5",    // Brand Indigo: Used for main buttons, active links, primary CTAs
            "secondary": "#64748b",  // Slate Gray: Used for secondary text, muted buttons, borders
            "accent": "#6366f1",     // Lighter Indigo: Used for subtle highlights
            "neutral": "#1e293b",    // Dark Slate: Used for heavy text, sidebar backgrounds
            "base-100": "#ffffff",   // Pure White: Used for card backgrounds and main layout surfaces
            "base-200": "#f8fafc",   // Off-White: Used for the main app background (behind the cards)
            
            // THE SYSTEM STATES (Tied to your AI Logic)
            "info": "#3b82f6",       // Blue: Standard system messages
            "success": "#10b981",    // Emerald: "Verified" payments, "Completed" maintenance
            "warning": "#f59e0b",    // Amber: "High" priority maintenance, "Pending" payments
            "error": "#ef4444",      // Red: "Anomalous" payments, "Emergency" maintenance
          },
        },
      ],
    }),
  ],
} satisfies Config