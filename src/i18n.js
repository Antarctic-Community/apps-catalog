import { ref } from 'vue'

/** Язык интерфейса. Карточки приложений остаются как в app.json. */
export const locale = ref('ru')

const messages = {
  ru: {
    documentTitle: 'Каталог приложений · Antarctic Wallet',
    loadError: 'Не удалось загрузить каталог',
    loading: 'Загрузка…',
    catalog: 'Каталог',
    search: 'Поиск',
    back: 'Назад',
    apps: 'Приложения',
    notFound: 'Приложение не найдено',
    toCatalog: 'В каталог',
    add: 'Добавить',
    open: 'Открыть',
    developer: 'Разработчик',
    release: 'Релиз',
    category: 'Категория',
    screenshot: 'скриншот',
    close: 'Закрыть',
    about: 'О приложении',
    info: 'Информация',
    app: 'Приложение',
    website: 'Сайт',
    support: 'Поддержка',
    placeholder: 'Название приложения...',
    cancel: 'Отмена',
    recent: 'Недавно искали',
    categories: 'Категории',
    all: 'Все',
    seeAll: 'Все ›',
    nothing: 'Ничего не найдено',
    nothingHint: 'Попробуйте изменить запрос или категорию',
    emptyCategory: 'В этой категории пока нет приложений',
    share: 'Поделиться',
    copied: 'Ссылка скопирована',
    verified: 'Проверено',
    'collection.top': 'Топ приложений',
    'collection.popular': 'Популярные',
    'collection.new': 'Новые',
    'collection.verified': 'Проверенные нами',
    'category.ai': 'AI',
    'category.social': 'Социальные',
    'category.finance': 'Финансы',
    'category.business': 'Бизнес',
    'category.tokens': 'Токены',
    'category.shopping': 'Покупки',
    'category.games': 'Игры',
    'category.media': 'Медиа',
    'category.other': 'Другое',
    'error.notFound': 'Приложение не найдено',
    'error.blocked': 'Приложение заблокировано',
    'error.suspended': 'Приложение приостановлено',
    'error.stackLimit': 'Сначала закройте одно из открытых приложений',
    'error.rateLimited': 'Слишком часто. Попробуйте через пару секунд',
    'error.invalidAppId': 'У приложения нет id в кошельке',
    'error.sameApp': 'Это и есть текущее приложение',
    'error.generic': 'Не удалось открыть приложение',
    'error.timeout': 'Кошелёк не ответил',
  },
  en: {
    documentTitle: 'App Catalog · Antarctic Wallet',
    loadError: 'Couldn’t load the catalog',
    loading: 'Loading…',
    catalog: 'Catalog',
    search: 'Search',
    back: 'Back',
    apps: 'Apps',
    notFound: 'App not found',
    toCatalog: 'Back to catalog',
    add: 'Add',
    open: 'Open',
    developer: 'Developer',
    release: 'Released',
    category: 'Category',
    screenshot: 'screenshot',
    about: 'About',
    info: 'Information',
    app: 'App',
    website: 'Website',
    support: 'Support',
    placeholder: 'App name...',
    cancel: 'Cancel',
    recent: 'Recent searches',
    categories: 'Categories',
    all: 'All',
    seeAll: 'All ›',
    nothing: 'Nothing found',
    nothingHint: 'Try a different search or category',
    emptyCategory: 'No apps in this category yet',
    share: 'Share',
    copied: 'Link copied',
    verified: 'Verified',
    'collection.top': 'Top apps',
    'collection.popular': 'Popular',
    'collection.new': 'New',
    'collection.verified': 'Verified by us',
    'category.ai': 'AI',
    'category.social': 'Social',
    'category.finance': 'Finance',
    'category.business': 'Business',
    'category.tokens': 'Tokens',
    'category.shopping': 'Shopping',
    'category.games': 'Games',
    'category.media': 'Media',
    'category.other': 'Other',
    'error.notFound': 'App not found',
    'error.blocked': 'App is blocked',
    'error.suspended': 'App is suspended',
    'error.stackLimit': 'Close one of the open apps first',
    'error.rateLimited': 'Too many requests. Try again in a few seconds',
    'error.invalidAppId': 'This app has no wallet id',
    'error.sameApp': 'This is the current app',
    'error.generic': 'Couldn’t open the app',
    'error.timeout': 'The wallet didn’t respond',
  },
}

/** BCP 47 из кошелька → язык каталога. Неизвестный код не меняет текущий. */
export function setLocale(code) {
  if (typeof code !== 'string' || !code.trim()) return
  let tag = code.trim()
  try {
    tag = Intl.getCanonicalLocales(tag)[0]
  } catch {
    return
  }
  const primary = tag.toLowerCase().split('-')[0]
  if (!messages[primary]) return
  locale.value = primary
  if (typeof document === 'undefined') return
  document.documentElement.lang = primary
  document.title = t('documentTitle')
}

export function t(key, fallback) {
  const value = messages[locale.value]?.[key] ?? messages.ru[key]
  return value ?? fallback ?? key
}

export function collectionTitle(id) {
  return t(`collection.${id}`, t('apps'))
}

export function categoryTitle(id, fallback) {
  return t(`category.${id}`, fallback)
}

export function formatDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  if (!y || !m || !d) return iso
  return locale.value === 'en' ? `${m}/${d}/${y}` : `${d}.${m}.${y}`
}
