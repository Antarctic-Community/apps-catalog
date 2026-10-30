// Мост между каталогом и местом, где он открыт.
//
// В браузере «Открыть» ведёт на тот же диплинк, что кнопка на aw.me/app/<awAppId>:
// AppsFlyer открывает мини-апку в кошельке (или магазин, если его нет).
// Внутри кошелька каталог — мини-апка (public/config.json). Кнопка ждёт окончания
// sdk.init() и зовёт sdk.openApp: кошелёк кладёт выбранную апку в свой стек.
// Пока мост не ответил, со страницы не уходим. window.open(_blank, noopener) из iframe
// и WebView то открывает системный браузер, то оставляет about:blank — каталог после
// этого уже не нажать, помогает только перезапуск.
// Если хост так и не заявил open_app, открываем https://aw.me/app/<awAppId> в этом же
// документе и ошибку не показываем. Сессию не храним: восстановленная карта команд
// без open_app оставляла бы каталог на этом запасном переходе до смерти WebView.
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
let connecting = null
let boundRouter = null
let routerBound = false
// Пока переход не завершился, повторные нажатия игнорируем: кошелёк
// принимает не больше одного open_app за 500 мс.
let opening = null

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

function bindRouter(router) {
  if (routerBound) return
  routerBound = true
  router.afterEach(() => syncBack(router))
}

async function loadAppId() {
  try {
    const response = await fetch(new URL('config.json', document.baseURI))
    if (!response.ok) return ''
    const config = await response.json()
    return config?.id || ''
  } catch {
    return ''
  }
}

function attach(sdk, router) {
  hostSdk = sdk
  paint(sdk)
  syncLanguage(sdk)
  syncBack(router)
  bindRouter(router)
  sdk.events.on('session.expired', () => {
    if (hostSdk !== sdk) return
    hostSdk = null
    connecting = null
    // destroy снимает слушателей прямо во время emit — откладываем на микрозадачу.
    queueMicrotask(() => {
      sdk.destroy()
      void ensureHost(router)
    })
  })
}

async function connectOnce(router) {
  const origin = parentOrigin()
  const appId = await loadAppId()
  if (!origin || !appId) return null

  const sdk = new AWSDK({
    appId,
    scopes: [],
    parentOrigin: origin,
    persistSession: false,
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
    return null
  }
  attach(sdk, router)
  return sdk
}

function ensureHost(router) {
  if (hostSdk) return Promise.resolve(hostSdk)
  if (!AWSDK.isInsideWallet() || !parentOrigin()) return Promise.resolve(null)
  if (!connecting) {
    connecting = connectOnce(router).then(
      (sdk) => {
        if (!sdk) connecting = null
        return sdk
      },
      () => {
        connecting = null
        return null
      },
    )
  }
  return connecting
}

// Скоупы каталогу не нужны: он только открывает другие апки.
export function initHost(router) {
  boundRouter = router
  void ensureHost(router)
}

function openExternal(url) {
  window.open(url, '_blank', 'noopener')
}

// Запасной путь старого кошелька. Навигация в этом же документе, а не новое окно:
// WebView видит настоящий aw.me и может перехватить его. window.open после await
// уже без жеста пользователя и в мобильном контейнере часто теряет URL.
function openWalletLink(app) {
  window.location.assign(appLink(app))
}

async function openWithSdk(sdk, app) {
  try {
    await sdk.openApp({ appId: app.awAppId })
  } catch (error) {
    if (error instanceof AWOpenAppError && error.errorCode === OpenAppErrorCodes.Unsupported) {
      openWalletLink(app)
      return
    }
    notify(t(error instanceof AWTimeoutError ? 'error.timeout' : OPEN_ERROR[error.errorCode] ?? 'error.generic'))
  }
}

async function openWhenReady(app) {
  // Если handshake уже идёт со старта страницы — ждём его. Повтор после неудачи
  // делает следующее нажатие: неудачный connecting сбрасывается.
  const sdk = await ensureHost(boundRouter)
  if (sdk?.isCommandAvailable(AWCommand.OpenApp)) {
    await openWithSdk(sdk, app)
    return
  }
  if (sdk) {
    openWalletLink(app)
    return
  }
  notify(t('error.timeout'))
}

export function openApp(app) {
  if (!AWSDK.isInsideWallet()) {
    openExternal(appDeepLink(app))
    return
  }
  if (opening) return
  if (hostSdk?.isCommandAvailable(AWCommand.OpenApp)) {
    opening = openWithSdk(hostSdk, app).finally(() => { opening = null })
    return
  }
  if (hostSdk) {
    openWalletLink(app)
    return
  }
  opening = openWhenReady(app).finally(() => { opening = null })
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
