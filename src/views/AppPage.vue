<script setup>
import { computed } from 'vue'
import { appById, catalog } from '../catalog'
import { capabilities, isAdded, addApp, openApp, appLink } from '../bridge'
import ShareButton from '../components/ShareButton.vue'
import VerifiedBadge from '../components/VerifiedBadge.vue'

const props = defineProps({ id: String })
const app = computed(() => appById(props.id))
const paragraphs = computed(() => app.value?.description.split(/\n{2,}/) ?? [])
const category = computed(() => catalog.value.categories.find((c) => c.id === app.value?.category)?.name)
const fmt = (d) => d.slice(0, 10).split('-').reverse().join('.')
const support = computed(() => {
  const s = app.value?.developer?.support
  return s && (s.includes('@') && !s.startsWith('http') ? `mailto:${s}` : s)
})
const supportLabel = computed(() => {
  const s = app.value?.developer?.support ?? ''
  const tg = s.match(/^https:\/\/t\.me\/@?([\w]+)\/?$/)
  return tg ? `@${tg[1]}` : s.replace(/^https:\/\//, '')
})
const host = (u) => new URL(u).host
const canAdd = computed(() => capabilities.canAdd && !isAdded(app.value?.id))
const primary = () => (canAdd.value ? addApp(app.value) : openApp(app.value))
</script>

<template>
  <div v-if="!app" class="empty"><strong>Приложение не найдено</strong><RouterLink to="/">В каталог</RouterLink></div>
  <template v-else>
    <header class="top"><RouterLink to="/" class="round" aria-label="Назад">‹</RouterLink></header>

    <div class="hero">
      <img class="icon xl" :src="app.icon" :alt="app.name" />
      <div class="hero-text">
        <h1>{{ app.name }}<VerifiedBadge v-if="app.verified" /></h1>
        <span class="row-tag">{{ app.tagline }}</span>
        <div class="hero-actions">
          <button class="primary sm" @click="primary">{{ canAdd ? 'Добавить' : 'Открыть' }}</button>
          <ShareButton :app="app" />
        </div>
      </div>
    </div>

    <dl class="facts">
      <div v-if="app.developer?.name"><dt>Разработчик</dt><dd>{{ app.developer.name }}</dd></div>
      <div v-if="app.addedAt"><dt>Релиз</dt><dd>{{ fmt(app.addedAt) }}</dd></div>
      <div><dt>Категория</dt><dd>{{ category }}</dd></div>
    </dl>

    <div v-if="app.screenshots.length" class="shots"><img v-for="s in app.screenshots" :key="s" :src="s" :alt="`${app.name} — скриншот`" loading="lazy" /></div>

    <section class="card"><h2>О приложении</h2><p v-for="p in paragraphs" :key="p">{{ p }}</p></section>
    <section class="card">
      <h2>Информация</h2>
      <div class="info"><span>Приложение</span><a :href="appLink(app)" target="_blank" rel="noopener">{{ appLink(app).replace(/^https:\/\//, '') }}</a></div>
      <div v-if="app.developer?.website" class="info"><span>Сайт</span><a :href="app.developer.website" target="_blank" rel="noopener">{{ host(app.developer.website) }}</a></div>
      <div v-if="support" class="info"><span>Поддержка</span><a :href="support" target="_blank" rel="noopener">{{ supportLabel }}</a></div>
    </section>

    <div class="bottom">
      <button class="primary" @click="primary">{{ canAdd ? 'Добавить' : 'Открыть' }}</button>
      <ShareButton :app="app" />
    </div>
  </template>
</template>
