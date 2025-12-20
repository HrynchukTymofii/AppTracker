import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, Check, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, availableLanguages } from '@/i18n/config';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const LanguageSelector = ({ visible, onClose, isDark }: LanguageSelectorProps) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLanguage());

  const handleSelectLanguage = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    await changeLanguage(languageCode);
    // Force re-render by updating i18n instance
    i18n.changeLanguage(languageCode);
    // Close modal after a short delay to show selection
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Globe size={24} color={isDark ? '#ffffff' : '#111827'} />
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? '#ffffff' : '#111827' },
                ]}
              >
                {t('language.selectLanguage')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDark ? '#ffffff' : '#111827'} />
            </TouchableOpacity>
          </View>

          {/* Current Language */}
          <View
            style={[
              styles.currentLanguageContainer,
              {
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
              },
            ]}
          >
            <Text
              style={[
                styles.currentLanguageLabel,
                { color: isDark ? '#9ca3af' : '#6b7280' },
              ]}
            >
              {t('language.currentLanguage')}
            </Text>
            <Text
              style={[
                styles.currentLanguageName,
                { color: isDark ? '#ffffff' : '#111827' },
              ]}
            >
              {availableLanguages.find((l) => l.code === selectedLanguage)?.nativeName}
            </Text>
          </View>

          {/* Language List */}
          <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
            {availableLanguages.map((language) => {
              const isSelected = language.code === selectedLanguage;
              return (
                <TouchableOpacity
                  key={language.code}
                  onPress={() => handleSelectLanguage(language.code)}
                  style={[
                    styles.languageItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(59, 130, 246, 0.2)'
                          : 'rgba(59, 130, 246, 0.1)'
                        : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.flagIcon}>{language.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageName,
                        {
                          color: isDark ? '#ffffff' : '#111827',
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {language.nativeName}
                    </Text>
                    <Text
                      style={[
                        styles.languageCode,
                        { color: isDark ? '#9ca3af' : '#6b7280' },
                      ]}
                    >
                      {language.name}
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color="#3b82f6" strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLanguageContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  currentLanguageLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentLanguageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  flagIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    marginBottom: 2,
  },
  languageCode: {
    fontSize: 13,
  },
});
