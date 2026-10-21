import { reactive, computed } from 'vue'

const state = reactive({ data: null, error: null })
let loading

export function loadCatalog() {
  loading ??= fetch(`${import.meta.env.BASE_URL}data/catalog.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((d) => (state.data = d))
    .catch((e) => (state.error = e))
  return loading
}

export const catalog = computed(() => state.data)
export const catalogError = computed(() => state.error)

export const appById = (id) => state.data?.apps.find((a) => a.id === id)
export const appsOf = (collection) =>
  (state.data?.collections[collection] ?? []).map(appById).filter(Boolean)
