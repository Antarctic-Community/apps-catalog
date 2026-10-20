<script setup>
import { computed } from 'vue'
import { appsOf, COLLECTIONS } from '../catalog'
import Section from '../components/Section.vue'
import ActionButton from '../components/ActionButton.vue'

const featured = computed(() => appsOf('featured').filter((a) => a.screenshots.length))
</script>

<template>
  <header class="top">
    <h1>Каталог</h1>
    <RouterLink :to="{ name: 'search' }" class="round" aria-label="Поиск">
      <svg viewBox="0 0 20 20" width="20" height="20"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="M14 14l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
    </RouterLink>
  </header>

  <div v-if="featured.length" class="banners">
    <RouterLink v-for="a in featured" :key="a.id" class="banner" :to="{ name: 'app', params: { id: a.id } }">
      <img class="banner-bg" :src="a.screenshots[0]" alt="" />
      <span class="banner-bar">
        <img class="icon sm" :src="a.icon" alt="" />
        <span class="row-text"><span class="row-name">{{ a.name }}</span><span class="row-tag">{{ a.tagline }}</span></span>
        <ActionButton :app="a" />
      </span>
    </RouterLink>
  </div>

  <Section title="Топ приложений" collection="top" :apps="appsOf('top')" ranked :limit="5" />
  <Section v-for="c in ['popular', 'new', 'verified']" :key="c" :title="COLLECTIONS[c]" :collection="c" :apps="appsOf(c)" />
</template>
