<script setup>
import { computed } from 'vue'
import { appsOf, COLLECTIONS } from '../catalog'
import AppRow from '../components/AppRow.vue'

const props = defineProps({ collection: String })
const apps = computed(() => appsOf(props.collection))
</script>

<template>
  <header class="top">
    <RouterLink to="/" class="round" aria-label="Назад">‹</RouterLink>
    <h1>{{ COLLECTIONS[collection] ?? 'Приложения' }}</h1>
  </header>
  <AppRow v-for="(a, i) in apps" :key="a.id" :app="a" :rank="collection === 'top' ? i + 1 : 0" />
</template>
