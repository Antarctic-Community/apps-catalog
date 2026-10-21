<script setup>
import AppRow from './AppRow.vue'
import { t } from '../i18n'
defineProps({ title: String, collection: String, apps: Array, ranked: Boolean, limit: { type: Number, default: 3 } })
</script>

<template>
  <section v-if="apps.length" class="section">
    <header class="section-head">
      <h2>{{ title }}</h2>
      <RouterLink v-if="apps.length > limit" :to="{ name: 'list', params: { collection } }" class="more">{{ t('seeAll') }}</RouterLink>
    </header>
    <AppRow v-for="(a, i) in apps.slice(0, limit)" :key="a.id" :app="a" :rank="ranked ? i + 1 : 0" />
  </section>
</template>
