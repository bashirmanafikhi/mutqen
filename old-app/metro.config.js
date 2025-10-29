const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. الحصول على الإعدادات الافتراضية لـ Expo
const config = getDefaultConfig(__dirname);

// 2. تعديل إعدادات Metro لدعم ملفات .wasm (لحزمة expo-sqlite)
// هذا يحل خطأ: Unable to resolve module ./wa-sqlite/wa-sqlite.wasm
config.resolver.assetExts.push('wasm');

// 💡 ملاحظة: NativeWind ستقوم بتغليف (Wrap) هذا الإعداد لاحقًا.
// هذه الطريقة تضمن أن nativewind سيحصل على التكوين الصحيح.

// 3. تطبيق NativeWind على التكوين المحدَّث
module.exports = withNativeWind(config, { input: "./app/globals.css" });