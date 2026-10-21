<script setup>
import { computed } from 'vue'
import { catalog } from '../catalog'
import { categoryTitle, t } from '../i18n'
import AppRow from '../components/AppRow.vue'
import BackLink from '../components/BackLink.vue'

const props = defineProps({ id: String })
const name = computed(() => {
  const found = catalog.value.categories.find((c) => c.id === props.id)
  return categoryTitle(props.id, found?.name ?? t('category'))
})
const apps = computed(() => catalog.value.apps.filter((a) => a.category === props.id))
</script>

<template>
  <header class="top">
    <BackLink :to="{ name: 'search' }" />
    <h1>{{ name }}</h1>
  </header>
  <AppRow v-for="a in apps" :key="a.id" :app="a" />
  <div v-if="!apps.length" class="empty"><strong>{{ t('emptyCategory') }}</strong></div>
</template>
