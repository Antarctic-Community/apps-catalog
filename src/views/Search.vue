<script setup>
import { ref, computed, onMounted } from 'vue'
import { catalog } from '../catalog'
import AppRow from '../components/AppRow.vue'
import iconServices from '../assets/categories/services.svg'
import iconCards from '../assets/categories/game.svg'
import iconUser from '../assets/categories/user.svg'
import iconDollar from '../assets/categories/dollar.svg'
import iconBag from '../assets/categories/bag.svg'
import iconDouble from '../assets/categories/double.svg'
import iconGames from '../assets/categories/games.svg'
import iconMedia from '../assets/categories/media.svg'

const categoryIcons = {
  ai: iconCards,
  social: iconUser,
  finance: iconDollar,
  business: iconBag,
  tokens: iconDouble,
  shopping: iconCards,
  games: iconGames,
  media: iconMedia,
  other: iconCards,
}

const q = ref('')
const showAll = ref(false)
const input = ref()
const recent = ref([])
const RECENT = 'catalog:recent'
try { recent.value = JSON.parse(localStorage.getItem(RECENT) ?? '[]') } catch {}
onMounted(() => input.value?.focus())

const results = computed(() => {
  const s = q.value.trim().toLowerCase()
  return catalog.value.apps.filter(
    (a) => !s || `${a.name} ${a.tagline} ${a.developer?.name ?? ''}`.toLowerCase().includes(s),
  )
})
const filledCategories = computed(() => {
  const used = new Set(catalog.value.apps.map((a) => a.category))
  return catalog.value.categories.filter((c) => used.has(c.id))
})
const searching = computed(() => q.value.trim() || showAll.value)
const recentApps = computed(() => recent.value.map((id) => catalog.value.apps.find((a) => a.id === id)).filter(Boolean))

function remember() {
  const hit = results.value[0]
  if (!q.value.trim() || !hit) return
  recent.value = [hit.id, ...recent.value.filter((i) => i !== hit.id)].slice(0, 5)
  try { localStorage.setItem(RECENT, JSON.stringify(recent.value)) } catch {}
}
</script>

<template>
  <form class="searchbar" @submit.prevent="remember">
    <label class="field">
      <svg viewBox="0 0 20 20" width="18" height="18"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M14 14l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
      <input ref="input" v-model="q" type="search" placeholder="Название приложения..." enterkeyhint="search" />
    </label>
    <RouterLink :to="{ name: 'home' }" class="cancel">Отмена</RouterLink>
  </form>

  <template v-if="!searching">
    <h3 v-if="recentApps.length" class="caps">Недавно искали</h3>
    <AppRow v-for="a in recentApps" :key="a.id" :app="a" />
    <h3 class="caps">Категории</h3>
    <div class="cats">
      <button class="cat" @click="showAll = true"><img :src="iconServices" alt="" width="20" height="20" />Все</button>
      <RouterLink v-for="c in filledCategories" :key="c.id" class="cat" :to="{ name: 'category', params: { id: c.id } }"><img v-if="categoryIcons[c.id]" :src="categoryIcons[c.id]" alt="" width="20" height="20" />{{ c.name }}</RouterLink>
    </div>
  </template>

  <template v-else>
    <AppRow v-for="a in results" :key="a.id" :app="a" />
    <div v-if="!results.length" class="empty">
      <strong>Ничего не найдено</strong>
      <span>Попробуйте изменить запрос или категорию</span>
    </div>
  </template>
</template>
