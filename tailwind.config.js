/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          primary: '#3B82F6',
          secondary: '#60A5FA',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          'text-primary': '#111827',
          'text-secondary': '#6B7280',
          border: '#E5E7EB',
        },
        // Dark mode colors
        dark: {
          primary: '#A855F7',
          secondary: '#C084FC',
          background: '#0F172A',
          surface: '#1E293B',
          'text-primary': '#F8FAFC',
          'text-secondary': '#CBD5E1',
          border: '#334155',
        },
      },
    },
  },
  plugins: [],
}

