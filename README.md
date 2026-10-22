# Antarctic Wallet · Apps Catalog

Открытый каталог мини-приложений. Бэкенда нет: источник правды — JSON и картинки в `apps/`,
модерация — через pull request'ы, сайт собирается в CI и публикуется на GitHub Pages.

- Добавить приложение → [CONTRIBUTING.md](CONTRIBUTING.md)
- Сайт: Vite + Vue 3 (hash-роутинг), `scripts/build-catalog.mjs` собирает `apps/*` в `public/data/catalog.json`
- Подборки и категории: `collections.json`, `categories.json` (правят только мейнтейнеры). При сборке `GET /api/v2/apps/<awAppId>`: «Топ» — пять с наибольшим MAU, «Проверенные нами» и значок — `isVerified`
- Внутри кошелька каталог открывается как обычный мини-апп; интеграция с нативным API — `src/bridge.js`

## Каталог как мини-апка

Манифест для кабинета AW — `public/config.json` (иконка — `public/icon.svg`). Скоупы не запрашиваются: каталог ничего не списывает и не читает профиль.

1. Создайте приложение в кабинете и впишите выданный `id` в `public/config.json`.
2. В поле App URL укажите адрес этого сайта (GitHub Pages или свой домен).
3. Опубликуйте. Кошелёк откроет каталог в iframe и передаст `?parentOrigin=`.

Дальше кнопка «Открыть» внутри кошелька вызывает `sdk.openApp({ appId })` — `awAppId` из карточки. Кошелёк кладёт выбранную мини-апку в свой стек (не больше 5). Диплинк с `aw.me` в этом режиме не открывается. В обычной вкладке браузера открывается тот же диплинк, что кнопка на `https://aw.me/app/<awAppId>`: `https://antarcticwallet.onelink.me/Juvy/go?deep_link_value=mini-apps/add&deep_link_sub1=<awAppId>`. «Поделиться» по-прежнему отдаёт короткую `https://aw.me/app/<awAppId>`.
