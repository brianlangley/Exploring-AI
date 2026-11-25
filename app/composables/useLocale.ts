import { en } from '~/locales/en'
import { nl } from '~/locales/nl'

export type Locale = 'nl' | 'en'

const LOCALE_KEY = 'lm-explained-locale'
const messagesByLocale = { en, nl }

// Two languages, no i18n library needed. Always Dutch by default: the site is presented in a Dutch class.
// Only a saved choice from the header switch changes it.
export function useLocale() {
  const locale = useState<Locale>('locale', () => 'nl')
  const messages = computed(() => messagesByLocale[locale.value])

  function setLocale(value: Locale) {
    locale.value = value
    localStorage.setItem(LOCALE_KEY, value)
  }

  function chooseLocale() {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'nl' || saved === 'en') locale.value = saved
  }

  return { locale, messages, setLocale, chooseLocale }
}
