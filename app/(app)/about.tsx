import { useSettings } from '@/context/AppSettingContext'; // تم إعادة استخدام الاسم المستعار لتصحيح مشكلة المسار
import { Ionicons } from '@expo/vector-icons'; // استخدام Ionicons من مكتبة Expo/Vector-Icons
import { Stack } from 'expo-router';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function AboutScreen() {
    const { isDark, fontSize, setFontSizeKey } = useSettings(); 

    // تحديد الألوان بناءً على الوضع الليلي
    const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
    const primaryTextColor = isDark ? 'text-white' : 'text-gray-900';
    const secondaryTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
    const cardBgColor = isDark ? 'bg-gray-800' : 'bg-white';
    const buttonBgColor = isDark ? 'bg-indigo-600' : 'bg-indigo-500';
    const buttonTextColor = 'text-white';
    const iconColor = isDark ? '#a5b4fc' : '#4f46e5'; // لون أيقونات مائل للبنفسجي

    // حجم الخط الأساسي لتطبيقه على النصوص العادية
    const baseFontSizeStyle = { fontSize: fontSize };

    // حجم خط العنوان الرئيسي (أكبر بـ 4 درجات من الأساسي)
    const titleFontSizeStyle = { fontSize: fontSize + 4 };
    
    // حجم خط العنوان الفرعي (أكبر بدرجتين من الأساسي)
    const subtitleFontSizeStyle = { fontSize: fontSize + 2 };

    // Placeholder image URL
    const placeholderImageUrl = 'https://placehold.co/400x200/2563eb/ffffff?text=App+Vision';

    return (
        <ScrollView className={`flex-1 p-4 ${bgColor}`}>
            <Stack.Screen 
                options={{ 
                    title: "حول التطبيق",
                    // تطبيق ألوان الهيدر بناءً على الثيم
                    headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
                    headerTintColor: isDark ? '#f9fafb' : '#111827',
                }} 
            />

            {/* قسم العنوان الرئيسي */}
            <View className={`mb-6 p-4 rounded-lg ${cardBgColor} shadow-md`}>
                <Text style={titleFontSizeStyle} className={`font-extrabold text-3xl mb-2 ${primaryTextColor}`}>
                    💡 رؤيتنا ورسالتنا
                </Text>
                <Text style={baseFontSizeStyle} className={`${secondaryTextColor} leading-6`}>
                    يهدف هذا التطبيق إلى تسهيل عملية التعلم المستمر والتركيز على الكلمات والمفاهيم الأساسية بلغات مختلفة. نحن نؤمن بأن التعلم يجب أن يكون مرناً، متاحاً، وقابلاً للتخصيص ليناسب أسلوبك الشخصي.
                </Text>
            </View>

            {/* قسم الصورة (مثال على عنصر مرئي) */}
            <View className={`mb-6 rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <Image
                    source={{ uri: placeholderImageUrl }}
                    style={{ width: '100%', height: 200 }}
                    resizeMode="cover"
                    className="rounded-t-lg"
                />
                <View className={`p-3 ${cardBgColor}`}>
                    <Text style={subtitleFontSizeStyle} className={`font-semibold ${primaryTextColor}`}>
                        التعلم اللامحدود
                    </Text>
                    <Text style={baseFontSizeStyle} className={`text-sm ${secondaryTextColor}`}>
                        تطبيقنا مصمم ليرافقك في كل خطوة من رحلتك التعليمية.
                    </Text>
                </View>
            </View>

            {/* قسم التفاصيل المتعددة (قائمة غير مرتبة) */}
            <View className={`mb-6 p-4 rounded-lg ${cardBgColor} shadow-md`}>
                <Text style={subtitleFontSizeStyle} className={`font-bold mb-3 ${primaryTextColor}`}>
                    ميزات التطبيق الأساسية
                </Text>
                {[
                    { iconName: 'ios-book-outline', text: 'مسارات تعليمية مخصصة بناءً على احتياجك.' },
                    { iconName: 'ios-moon-outline', text: 'واجهة مستخدم مريحة للعين وتدعم الوضع الداكن.' },
                    { iconName: 'ios-arrow-up-circle-outline', text: 'تحديثات شهرية للمحتوى وإضافة ميزات جديدة.' },
                ].map((item, index) => (
                    <View key={index} className={`flex-row items-start py-2 ${index < 2 ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}` : ''}`}>
                        <View className="mr-3 mt-1">
                            <Ionicons name={item.iconName as any} size={20} color={iconColor} />
                        </View>
                        <Text style={baseFontSizeStyle} className={`flex-1 ${primaryTextColor}`}>
                            {item.text}
                        </Text>
                    </View>
                ))}
            </View>

            {/* قسم الأزرار (أمثلة على التفاعل) */}
            <View className="flex-row justify-around mb-8">
                <TouchableOpacity 
                    onPress={() => setFontSizeKey('large')} // مثال على تفاعل يغير الإعداد
                    className={`flex-row items-center px-5 py-3 rounded-full ${buttonBgColor} shadow-lg`}
                >
                     <Ionicons name="resize-outline" size={18} color={buttonTextColor} style={{ marginRight: 8 }} />
                    <Text style={baseFontSizeStyle} className={`font-bold ${buttonTextColor} ml-2`}>
                        تكبير الخط (تجربة)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => console.log('Sharing App...')}
                    className={`flex-row items-center px-5 py-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} shadow-lg`}
                >
                    <Ionicons name="share-social-outline" size={18} color={isDark ? '#fff' : '#111827'} style={{ marginRight: 8 }} />
                    <Text style={baseFontSizeStyle} className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>
                        مشاركة
                    </Text>
                </TouchableOpacity>
            </View>

            {/* قسم التذييل (نصوص أصغر) */}
            <Text style={{ fontSize: fontSize - 2 }} className={`text-center mb-6 ${secondaryTextColor}`}>
                الإصدار: 1.0.0 | جميع الحقوق محفوظة {new Date().getFullYear()}
            </Text>

        </ScrollView>
    );
}
