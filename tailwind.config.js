/** @type {import('tailwindcss').Config} */
module.exports = {
  // يحدد NativeWind المحتوى تلقائياً لمعظم ملفات Expo
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}", // إضافة مجلد app
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // 1. إضافة الخطوط المخصصة
      // يجب أن يتم تحميل هذه الخطوط عبر expo-font في ملف _layout.tsx أو RootLayout
      fontFamily: {
        // خطوط عربية / قرآنية
        uthmanic: ['uthmanic_hafs1_ver13'], // فئة: font-uthmanic
        
        // خطوط لاتينية
        calibri: ['calibri'], // فئة: font-calibri
        times: ['times_new_roman'], // فئة: font-times
        
        // يمكنك تعيين خط افتراضي، مثلاً:
        // sans: ['calibri', 'sans-serif'],
      },
      
      // 2. توسيع نطاق الألوان لضمان دعم أفضل للوضع الداكن
      colors: {
        // توسيع الألوان الرمادية لضمان توفر الظلال في الوضعين
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        
        // أمثلة لألوان مخصصة يمكنك استخدامها مستقبلاً
        primary: {
          DEFAULT: '#4f46e5', // Indigo 600
          light: '#818cf8',
          dark: '#3730a3',
        },
        accent: {
          DEFAULT: '#10b981', // Emerald 500
        },
      },
    },
  },
  // 3. تفعيل الوضع الداكن بناءً على الكلاس 'dark'
  // هذا يضمن أن 'dark:' يعمل على المكونات التي يتم تمرير الكلاس إليها
  darkMode: 'class', 
  plugins: [],
}
