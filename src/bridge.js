// Мост между каталогом и местом, где он открыт.
//
// В браузере «Открыть» ведёт на тот же диплинк, что кнопка на aw.me/app/<awAppId>:
// AppsFlyer открывает мини-апку в кошельке (или магазин, если его нет).
// Внутри кошелька каталог — мини-апка (public/config.json): после handshake
// та же кнопка зовёт sdk.openApp и кошелёк кладёт выбранную апку в свой стек.
// Команды «добавить на домашний экран» в SDK нет — capabilities.canAdd остаётся false.
import { reactive, ref } from 'vue'
import { AWCommand, AWOpenAppError, AWSDK, AWTimeoutError, OpenAppErrorCodes } from '@antarctic-wallet/aw-sdk'
import { setLocale, t } from './i18n'

const query = new URLSearchParams(location.search + '&' + (location.hash.split('?')[1] ?? ''))
export const host = AWSDK.isInsideWallet() && query.has('parentOrigin') ? 'wallet' : 'web'

export const capabilities = { canAdd: false }

const added = reactive(new Set())
export const isAdded = (id) => capabilities.canAdd && added.has(id)
export const addApp = (app) => { if (capabilities.canAdd) added.add(app.id) }

export const notice = ref('')
let noticeTimer = 0
function notify(text) {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 2400)
}

export const appLink = (app) => `https://aw.me/app/${app.awAppId}`

// Та же ссылка, что основная кнопка на https://aw.me/app/<awAppId>.
const APP_DEEP_LINK = 'https://antarcticwallet.onelink.me/Juvy/go?deep_link_value=mini-apps/add&deep_link_sub1='
export const appDeepLink = (app) => `${APP_DEEP_LINK}${encodeURIComponent(app.awAppId)}`

const BG = { light: '#f5f5f8', dark: '#0b0d14' }
const OPEN_ERROR = {
  [OpenAppErrorCodes.NotFound]: 'error.notFound',
  [OpenAppErrorCodes.Blocked]: 'error.blocked',
  [OpenAppErrorCodes.Suspended]: 'error.suspended',
  [OpenAppErrorCodes.StackLimit]: 'error.stackLimit',
  [OpenAppErrorCodes.RateLimited]: 'error.rateLimited',
  [OpenAppErrorCodes.InvalidAppId]: 'error.invalidAppId',
  [OpenAppErrorCodes.SameApp]: 'error.sameApp',
  [OpenAppErrorCodes.GenericError]: 'error.generic',
}

// Язык известен до handshake: кошелёк кладёт его в awLanguageCode.
setLocale(query.get('awLanguageCode'))

let hostSdk = null

function parentOrigin() {
  return query.get('parentOrigin') ?? ''
}

function paint(sdk) {
  const scheme = sdk.colorScheme
  if (scheme !== 'light' && scheme !== 'dark') return
  document.documentElement.dataset.theme = scheme
  document.documentElement.style.colorScheme = scheme
  if (hostSdk) sdk.setBackgroundColor(BG[scheme])
}

function syncLanguage(sdk) {
  setLocale(sdk.languageCode || query.get('awLanguageCode'))
}

function syncBack(router) {
  if (!hostSdk) return
  if (router.currentRoute.value.name === 'home') hostSdk.backButton.hide()
  else hostSdk.backButton.show()
}

let consumeBack = null
/** Если вернуло true, системная «Назад» уже обработана и страницу не закрываем. */
export function setBackOverride(fn) {
  consumeBack = fn
}

function goBack(router) {
  if (consumeBack?.()) return
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}

// Скоупы каталогу не нужны: он только открывает другие апки.
export function initHost(router) {
  if (!AWSDK.isInsideWallet()) return
  const origin = parentOrigin()
  if (!origin) return

  void (async () => {
    let config
    try {
      const response = await fetch(new URL('config.json', document.baseURI))
      if (!response.ok) return
      config = await response.json()
    } catch {
      return
    }
    if (!config?.id) return

    const sdk = new AWSDK({
      appId: config.id,
      scopes: [],
      parentOrigin: origin,
      persistSession: true,
    })
    sdk.events.on('themeChanged', () => paint(sdk))
    sdk.events.on('languageChanged', () => syncLanguage(sdk))
    sdk.backButton.onClick(() => goBack(router))
    paint(sdk)
    syncLanguage(sdk)

    try {
      await sdk.init()
    } catch {
      sdk.destroy()
      return
    }
    hostSdk = sdk
    paint(sdk)
    syncLanguage(sdk)
    syncBack(router)
    router.afterEach(() => syncBack(router))
  })()
}

export function openApp(app) {
  if (hostSdk?.isCommandAvailable(AWCommand.OpenApp)) {
    hostSdk.openApp({ appId: app.awAppId }).catch((error) => {
      if (error instanceof AWOpenAppError && error.errorCode === OpenAppErrorCodes.Unsupported) {
        window.open(appDeepLink(app), '_blank', 'noopener')
        return
      }
      notify(t(error instanceof AWTimeoutError ? 'error.timeout' : OPEN_ERROR[error.errorCode] ?? 'error.generic'))
    })
    return
  }
  window.open(appDeepLink(app), '_blank', 'noopener')
}

// Нативная штора «Поделиться» (navigator.share). Делимся ссылкой aw.me/app/<id> — она открывается
// и вне каталога. Если share недоступен (десктоп, iframe без allow="web-share") — копируем ссылку.
export async function shareApp(app) {
  const url = appLink(app)
  if (navigator.share) {
    try {
      await navigator.share({ title: app.name, text: app.tagline, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled' // пользователь закрыл шторку
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
