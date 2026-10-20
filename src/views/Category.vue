<script setup>
import { computed } from 'vue'
import { catalog } from '../catalog'
import AppRow from '../components/AppRow.vue'

const props = defineProps({ id: String })
const name = computed(() => catalog.value.categories.find((c) => c.id === props.id)?.name ?? 'Категория')
const apps = computed(() => catalog.value.apps.filter((a) => a.category === props.id))
</script>

<template>
  <header class="top">
    <RouterLink :to="{ name: 'search' }" class="round" aria-label="Назад">‹</RouterLink>
    <h1>{{ name }}</h1>
  </header>
  <AppRow v-for="a in apps" :key="a.id" :app="a" />
  <div v-if="!apps.length" class="empty"><strong>В этой категории пока нет приложений</strong></div>
</template>
