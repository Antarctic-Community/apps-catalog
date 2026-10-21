<script setup>
import { computed } from 'vue'
import { appsOf } from '../catalog'
import { collectionTitle } from '../i18n'
import AppRow from '../components/AppRow.vue'
import BackLink from '../components/BackLink.vue'

const props = defineProps({ collection: String })
const apps = computed(() => appsOf(props.collection))
</script>

<template>
  <header class="top">
    <BackLink to="/" />
    <h1>{{ collectionTitle(collection) }}</h1>
  </header>
  <AppRow v-for="(a, i) in apps" :key="a.id" :app="a" :rank="collection === 'top' ? i + 1 : 0" />
</template>
