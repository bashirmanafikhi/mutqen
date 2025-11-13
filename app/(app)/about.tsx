import { useSettings } from '@/context/AppSettingContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const fontMap = {
  small: "text-app-sm",
  medium: "text-app-md",
  large: "text-app-lg",
  xlarge: "text-app-xl",
};

export default function AboutScreen() {
  const { fontSizeKey, setFontSizeKey, isDark } = useSettings();
  const textClass = fontMap[fontSizeKey];
  const titleClass = `${fontMap[fontSizeKey]} text-app-xl font-extrabold`;
  const subtitleClass = `${fontMap[fontSizeKey]} text-app-lg font-semibold`;

  const iconColor = isDark ? '#a5b4fc' : '#4f46e5';

  const features: { iconName: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { iconName: 'book', text: 'التذكر النشط (Active Recall) لتقوية الذاكرة طويلة المدى.' },
    { iconName: 'repeat', text: 'الجدولة المتباعدة (Spaced Repetition) لمراجعة ذكية ودقيقة.' },
    { iconName: 'checkmark-done', text: 'عرض كلمة بكلمة لتصحيح الأخطاء اللفظية وتحسين الدقة.' },
  ];

  return (
    <ScrollView className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">

      <Stack.Screen
        options={{
          title: "حول التطبيق",
          headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
          headerTintColor: isDark ? '#f9fafb' : '#111827',
        }}
      />

      {/* مقدمة */}
      <View className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <Text className={`${titleClass} mb-2 text-gray-900 dark:text-white`}>
          📖 متقن: برنامجك لإتقان الحفظ القرآني العميق
        </Text>
        <Text className={`${textClass} leading-6 text-gray-600 dark:text-gray-400`}>
          تطبيق <Text className="font-semibold text-indigo-600 dark:text-indigo-400">متقن</Text> هو أداة ذكية تساعدك على نقل حفظك للقرآن من الذاكرة قصيرة المدى إلى الذاكرة طويلة المدى بثبات وفعالية، مستندًا إلى علم الأعصاب الإدراكي وتقنيات تعليمية حديثة.
        </Text>
      </View>

      {/* صورة وتعريف */}
      <View className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <Image
          source={require('@/assets/images/quran-memorization.png')}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
        <View className="p-3 bg-white dark:bg-gray-800">
          <Text className={`${subtitleClass} text-gray-900 dark:text-white mb-1`}>
            🎯 التحدي في حفظ القرآن
          </Text>
          <Text className={`${textClass} text-gray-600 dark:text-gray-400`}>
            الصعوبة الحقيقية ليست في الحفظ الجديد، بل في <Text className="font-semibold">تثبيت المحفوظ ومقاومة النسيان</Text>.  
            يواجه الحافظ ثلاث عقبات رئيسية: سرعة النسيان، التكرار غير المتوازن بين الآيات، والملل من الطرق التقليدية.
          </Text>
        </View>
      </View>

      {/* الحلول والميزات */}
      <View className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <Text className={`${subtitleClass} text-gray-900 dark:text-white mb-3`}>
          💡 الحل الذكي من متقن
        </Text>
        <Text className={`${textClass} mb-4 text-gray-600 dark:text-gray-400`}>
          يجمع متقن بين التقنية والعلم العصبي لتقديم تجربة حفظ فعّالة ومدروسة عبر آليات حديثة.
        </Text>

        {features.map((item, index) => (
          <View
            key={index}
            className={`flex-row items-start py-2 ${index < 2 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
          >
            <View className="mr-3 mt-1">
              <Ionicons name={item.iconName} size={20} color={iconColor} />
            </View>
            <Text className={`${textClass} flex-1 text-gray-900 dark:text-white`}>
              {item.text}
            </Text>
          </View>
        ))}
      </View>

      {/* الإرشادات */}
      <View className="mb-8 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <Text className={`${subtitleClass} text-gray-900 dark:text-white mb-3`}>
          ✅ إرشادات لتحقيق الإتقان
        </Text>
        <Text className={`${textClass} text-gray-600 dark:text-gray-400`}>
          • اجعل متقن جزءًا من روتينك اليومي.{"\n"}
          • أكمل التحديات قبل مغادرة الجلسة.{"\n"}
          • اقرأ بصوت مرتفع وببطء مع مراعاة التجويد.{"\n"}
          • امنح ذاكرتك فرصة للتذكر قبل الكشف عن الآية.{"\n"}
          • راجع وحدات كبيرة كالجزء أو السورة لضمان ترابط المعاني.
        </Text>
      </View>

      {/* أزرار */}
      <View className="flex-row justify-center mb-8">
        <TouchableOpacity
          onPress={() => setFontSizeKey('large')}
          className="flex-row items-center px-5 py-3 rounded-full bg-indigo-500 dark:bg-indigo-600 shadow-lg"
        >
          <Ionicons name="resize-outline" size={18} color="#fff" />
          <Text className={`${textClass} font-bold text-white ml-2`}>تكبير الخط</Text>
        </TouchableOpacity>
      </View>

      {/* تذييل */}
      <Text className={`${fontMap[fontSizeKey]} text-center mb-6 text-gray-600 dark:text-gray-400`}>
        الإصدار: 1.0.0 | جميع الحقوق محفوظة {new Date().getFullYear()}
      </Text>

    </ScrollView>
  );
}
