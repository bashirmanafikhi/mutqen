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
  const placeholderImageUrl = './assets/images/quran-memorization.png';

  const features: { iconName: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { iconName: 'book', text: 'مسارات تعليمية مخصصة بناءً على احتياجك.' },
    { iconName: 'moon', text: 'واجهة مستخدم مريحة للعين وتدعم الوضع الداكن.' },
    { iconName: 'arrow-up', text: 'تحديثات شهرية للمحتوى وإضافة ميزات جديدة.' },
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

      {/* Title */}
      <View className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <Text className={`${titleClass} mb-2 text-gray-900 dark:text-white`}>
          💡 رؤيتنا ورسالتنا
        </Text>
        <Text className={`${textClass} leading-6 text-gray-600 dark:text-gray-400`}>
          يهدف هذا التطبيق إلى تسهيل عملية التعلم المستمر...
        </Text>
      </View>

      {/* Image */}
      <View className="mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <Image
          source={require('@/assets/images/quran-memorization.png')}
          style={{ width: '100%', height: 200 }}
          resizeMode="cover"
        />
        <View className="p-3 bg-white dark:bg-gray-800">
          <Text className={`${subtitleClass} text-gray-900 dark:text-white`}>
            التعلم اللامحدود
          </Text>
          <Text className={`${textClass} text-gray-600 dark:text-gray-400`}>
            تطبيقنا مصمم ليرافقك في كل خطوة من رحلتك التعليمية.
          </Text>
        </View>
      </View>

      {/* Features */}
      <View className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <Text className={`${subtitleClass} text-gray-900 dark:text-white mb-3`}>
          ميزات التطبيق الأساسية
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

      {/* Buttons */}
      <View className="flex-row justify-around mb-8">
        <TouchableOpacity
          onPress={() => setFontSizeKey('large')}
          className="flex-row items-center px-5 py-3 rounded-full bg-indigo-500 dark:bg-indigo-600 shadow-lg"
        >
          <Ionicons name="resize-outline" size={18} color="#fff" className="mr-2" />
          <Text className={`${textClass} font-bold text-white`}>تكبير الخط</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          onPress={() => console.log('Sharing App...')}
          className="flex-row items-center px-5 py-3 rounded-full bg-gray-200 dark:bg-gray-700 shadow-lg"
        >
          <Ionicons name="share-social-outline" size={18} color={isDark ? '#fff' : '#111827'} className="mr-2" />
          <Text className={`${textClass} font-bold text-gray-900 dark:text-white`}>
            مشاركة
          </Text>
        </TouchableOpacity> */}
      </View>

      {/* Footer */}
      <Text className={`${fontMap[fontSizeKey]} text-center mb-6 text-gray-600 dark:text-gray-400`}>
        الإصدار: 1.0.0 | جميع الحقوق محفوظة {new Date().getFullYear()}
      </Text>

    </ScrollView>
  );
}
