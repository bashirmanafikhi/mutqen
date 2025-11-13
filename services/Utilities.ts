

import { Linking, Share } from 'react-native';

export const toArabicNumber = (num: number): string => {
  const arabicDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return num.toString().split('').map(d => arabicDigits[parseInt(d)]).join('');
};

export class AppActionsService {
  static async rateApp() {
    try {
      const url = 'https://play.google.com/store/apps/details?id=com.bashirmanafikhi.Mutqen';
      await Linking.openURL(url);
    } catch (e) {
      console.warn('Unable to open store URL', e);
    }
  }

  static async shareApp() {
    try {
      const message = 'جرب تطبيق متقن لحفظ القرآن: \nhttps://play.google.com/store/apps/details?id=com.bashirmanafikhi.Mutqen';
      await Share.share({ message });
    } catch (e) {
      console.warn('Unable to share app', e);
    }
  }

  static async sendFeedback() {
    try {
      const email = 'bashir.manafikhi@gmail.com';
      const subject = encodeURIComponent('ملاحظات حول تطبيق متقن');
      const body = encodeURIComponent('السلام عليكم،\n\nلدي الملاحظات التالية:\n\n');
      const mailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      await Linking.openURL(mailUrl);
    } catch (e) {
      console.warn('Unable to open email app', e);
    }
  }
}
