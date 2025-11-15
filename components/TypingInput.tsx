// components/TypingInput.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

// Define the expected props for clarity
interface TypingInputProps {
  blanks: any[]; // Use a more specific type if possible, e.g., Blank[]
  currentBlankIndex: number;
  typingInput: string;
  setTypingInput: (text: string) => void;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
  handleAnswer: (answer: string) => void;
  t: (key: string, options?: any) => string;
}

export default function TypingInput({ 
  blanks, 
  currentBlankIndex, 
  typingInput, 
  setTypingInput, 
  showHint, 
  setShowHint,
  handleAnswer,
  t
}: TypingInputProps) {
  if (blanks.length === 0 || currentBlankIndex >= blanks.length) return null;

  const handleSubmit = () => {
    if (typingInput.trim()) {
      handleAnswer(typingInput.trim());
      setTypingInput("");
    }
  };
  
  const currentBlank = blanks[currentBlankIndex];
  
  // Guard against missing currentBlank
  if (!currentBlank) return null;

  const hintText = currentBlank.correctText.length > 3
    ? t('cloze.hint_details_with_start', { count: currentBlank.correctText.length, char: currentBlank.correctText[0] })
    : t('cloze.hint_details', { count: currentBlank.correctText.length });

  return (
    <View style={{ marginTop: 24 }}>
      <TextInput
        placeholder={t('cloze.placeholder')}
        value={typingInput}
        onChangeText={setTypingInput}
        style={{
          borderWidth: 2,
          borderColor: '#D1D5DB',
          borderRadius: 12,
          padding: 16,
          fontSize: 18,
          textAlign: 'right',
          backgroundColor: '#FFFFFF',
          color: '#111827'
        }}
        onSubmitEditing={handleSubmit}
        autoFocus
        returnKeyType="done"
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 12 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#6366F1',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}
          onPress={handleSubmit}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 8 }}>{t('cloze.check')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#6B7280',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}
          onPress={() => setShowHint(!showHint)}
        >
          <Ionicons name="help-circle" size={20} color="white" />
          <Text style={{ color: 'white', fontWeight: 'bold', marginRight: 8 }}>{t('cloze.hint')}</Text>
        </TouchableOpacity>
      </View>

      {showHint && currentBlank && (
        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#EFF6FF', borderRadius: 8 }}>
          <Text style={{ color: '#1E40AF', textAlign: 'center' }}>
            {hintText}
          </Text>
        </View>
      )}
    </View>
  );
}