// src/components/AddNewLearningModal.tsx
import { QuranDivision, QuranJuz, QuranPage, Surah } from '@/models/QuranModels';
import { fetchWordRangeForPage, fetchWordRangeForSurah } from '@/services/data/wordQueries';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityRole,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SelectHizbModal from './SelectHizbModal';
import SelectJuzModal from './SelectJuzModal';
import SelectPageModal from './SelectPageModal';
import SelectSahabaDivisionModal from './SelectSahabaDivisionModal';
import SelectSurahModal from './SelectSurahModal';

interface AddNewLearningModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateLearning: (title: string, startWordId: number, endWordId: number) => void;
}

enum ActiveModal {
  None,
  Surah,
  Page,
  Juz,
  Hizb,
  SahabaDivision,
}

export default function AddNewLearningModal({
  isVisible,
  onClose,
  onCreateLearning,
}: AddNewLearningModalProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(ActiveModal.None);
  const { t } = useTranslation();

  const reset = () => {
    setActiveModal(ActiveModal.None);
    onClose();
  };

  // Auto-save after selection
  const finalize = (title: string, start: number, end: number) => {
    onCreateLearning(title, start, end);
    reset();
  };

  const handleSelectSurah = async (surah: Surah) => {
    setActiveModal(ActiveModal.None);
    try {
      const range = await fetchWordRangeForSurah(surah.id);
      if (!range) return;
      finalize(surah.name!, range.start, range.end);
    } catch (err) {
      console.error('fetchWordRangeForSurah error', err);
      Alert.alert('خطأ', 'تعذّر جلب نطاق السورة. حاول مرة أخرى.');
    }
  };

  const handleSelectPage = async (page: QuranPage) => {
    setActiveModal(ActiveModal.None);
    try {
      const range = await fetchWordRangeForPage(page.id);
      if (!range) return;
      const title = `الصفحة ${page.id}`;
      finalize(title, range.start, range.end);
    } catch (err) {
      console.error('fetchWordRangeForPage error', err);
      Alert.alert('خطأ', 'تعذّر جلب نطاق الصفحة. حاول مرة أخرى.');
    }
  };

  const handleSelectJuz = (juz: QuranJuz) => {
    finalize(juz.name, juz.first_word_id, juz.last_word_id);
  };

  const handleSelectHizb = (hizb: QuranDivision) => {
    finalize(hizb.name, hizb.first_word_id, hizb.last_word_id);
  };

  const handleSelectSahabaDivision = (division: QuranDivision) => {
    finalize(division.name, division.first_word_id, division.last_word_id);
  };

  const OptionButton = ({
    title,
    onPress,
    accessibleLabel,
  }: {
    title: string;
    onPress: () => void;
    accessibleLabel?: string;
  }) => (
    <TouchableOpacity
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={accessibleLabel ?? title}
      onPress={onPress}
      className="w-full p-4 rounded-lg mb-3 border border-app-border-light dark:border-app-border-dark bg-app-surface-light dark:bg-app-surface-dark"
      activeOpacity={0.8}
    >
      <Text className="text-center text-lg font-semibold text-app-primary-light dark:text-app-primary-dark">
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={reset}>
      <SafeAreaView className="flex-1">
        {/* Overlay */}
        <View className="absolute inset-0 bg-black/40" />

        {/* Modal sheet */}
        <View className="flex-1 justify-center">
          <View className="mx-4 mb-6 rounded-2xl overflow-hidden shadow-lg bg-app-surface-light dark:bg-app-surface-dark border border-app-border-light dark:border-app-border-dark">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-app-border-light dark:border-app-border-dark bg-app-bg-light dark:bg-app-bg-dark">
              <Text className="text-xl font-bold text-app-text-primary-light dark:text-app-text-primary-dark">
                {t('add_new.title')}
              </Text>

              <TouchableOpacity onPress={reset} accessibilityRole={'button' as AccessibilityRole} className="p-2">
                <Text className="text-sm font-semibold text-app-error-light dark:text-app-error-dark">{t('add_new.cancel')}</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={{ padding: 16 }} className="bg-app-surface-light dark:bg-app-surface-dark">

              <OptionButton title={t('add_new.option.surah')} onPress={() => setActiveModal(ActiveModal.Surah)} />
              <OptionButton title={t('add_new.option.juz')} onPress={() => setActiveModal(ActiveModal.Juz)} />
              <OptionButton title={t('add_new.option.hizb')} onPress={() => setActiveModal(ActiveModal.Hizb)} />
              <OptionButton title={t('add_new.option.sahaba')} onPress={() => setActiveModal(ActiveModal.SahabaDivision)} />
              <OptionButton title={t('add_new.option.page')} onPress={() => setActiveModal(ActiveModal.Page)} />

              <TouchableOpacity
                onPress={() => Alert.alert('قريباً', 'ميزة التحديد المخصص ستكون متاحة قريبًا')}
                className="w-full p-4 rounded-lg mb-3 border border-app-border-light dark:border-app-border-dark bg-app-bg-light dark:bg-app-bg-dark"
                activeOpacity={0.8}
                accessibilityRole={'button' as AccessibilityRole}
                accessibilityLabel="تحديد مخصص"
              >
                <Text className="text-center text-base font-semibold text-app-text-secondary-light dark:text-app-text-secondary-dark">
                  {t('add_new.option.custom_soon')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Sub-modals for selections */}
        <SelectSurahModal
          isVisible={activeModal === ActiveModal.Surah}
          onClose={() => setActiveModal(ActiveModal.None)}
          onSelectSurah={handleSelectSurah}
        />

        <SelectPageModal
          isVisible={activeModal === ActiveModal.Page}
          onClose={() => setActiveModal(ActiveModal.None)}
          onSelectPage={handleSelectPage}
        />

        <SelectJuzModal
          isVisible={activeModal === ActiveModal.Juz}
          onClose={() => setActiveModal(ActiveModal.None)}
          onSelectJuz={handleSelectJuz}
        />

        <SelectHizbModal
          isVisible={activeModal === ActiveModal.Hizb}
          onClose={() => setActiveModal(ActiveModal.None)}
          onSelectHizb={handleSelectHizb}
        />

        <SelectSahabaDivisionModal
          isVisible={activeModal === ActiveModal.SahabaDivision}
          onClose={() => setActiveModal(ActiveModal.None)}
          onSelectDivision={handleSelectSahabaDivision}
        />
      </SafeAreaView>
    </Modal>
  );
}
