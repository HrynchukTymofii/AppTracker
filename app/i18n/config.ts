import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en-US.json';
import enGB from './locales/en-GB.json';
import de from './locales/de-DE.json';
import fr from './locales/fr-FR.json';
import uk from './locales/uk-UA.json';
import es from './locales/es-ES.json';
import zh from './locales/zh-CN.json';
import ja from './locales/ja-JP.json';
import pt from './locales/pt-BR.json';
import it from './locales/it-IT.json';
import ko from './locales/ko-KR.json';
import nl from './locales/nl-NL.json';
import pl from './locales/pl-PL.json';
import ar from './locales/ar-SA.json';
import hi from './locales/hi-IN.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

const resources = {
  'en-US': { translation: en },
  'en-GB': { translation: enGB },
  'de-DE': { translation: de },
  'fr-FR': { translation: fr },
  'uk-UA': { translation: uk },
  'es-ES': { translation: es },
  'zh-CN': { translation: zh },
  'ja-JP': { translation: ja },
  'pt-BR': { translation: pt },
  'it-IT': { translation: it },
  'ko-KR': { translation: ko },
  'nl-NL': { translation: nl },
  'pl-PL': { translation: pl },
  'ar-SA': { translation: ar },
  'hi-IN': { translation: hi },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (!savedLanguage) {
    // Get system language and find best match
    const locales = getLocales();
    const systemLocale = locales[0]?.languageTag || 'en-US'; // e.g., "en-US", "en", "de-DE"

    // Try exact match first
    if (resources[systemLocale as keyof typeof resources]) {
      savedLanguage = systemLocale;
    } else {
      // Try language code only (e.g., "en" from "en-AU")
      const languageCode = systemLocale.split('-')[0];
      const fallbackLocale = Object.keys(resources).find(key => key.startsWith(languageCode));
      savedLanguage = fallbackLocale || 'en-US';
    }
  }

  return await i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

// Initialize immediately
initI18n().catch(console.error);

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
};

export const getCurrentLanguage = () => i18n.language;

export const availableLanguages = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'uk-UA', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export default i18n;
