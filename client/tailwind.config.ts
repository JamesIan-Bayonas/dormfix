import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        // Custom palette mappings to match Screenshot 2026-06-28 214140.png
        sage: {
          50: '#f8f9f5',   // Main application soft background canvas
          100: '#e7efdb',  // Total Rooms card background tint
          200: '#c2ceae',  // Total Tenants card background tint
          700: '#5c6e4e',  // High-contrast muted text for room metrics
          800: '#425042',  // Primary matte olive sidebar navigation background
          900: '#344034',  // Deep active dark olive state
        },
        amberGold: {
          50: '#fef9eb',   // Active Alerts card background tint
          600: '#b97a26',  // Alert tracking text color
        }
      }
    },
  },
  plugins: [
    require("daisyui")({
      themes: [
        {
          dormfix: {
            "primary": "#425042",    // Matte Olive: Replaces bright brand indigo
            "secondary": "#657655",  // Sage Accent text color
            "accent": "#b7c4a9",     // Soft header badge accent
            "neutral": "#425042",    // Sidebar base
            "base-100": "#ffffff",   // pure clean paper elements
            "base-200": "#f8f9f5",   // Soft canvas off-white background
            
            // SYSTEM FEEDBACKS (Toned down to match premium UI palettes)
            "info": "#3b82f6",       
            "success": "#5c6e4e",    
            "warning": "#dcb974",    
            "error": "#cc4747",      
          },
        },
      ],
    }),
  ],
} satisfies Config