<script setup>
import { loadCatalog, catalog, catalogError } from './catalog'
import { notice } from './bridge'
loadCatalog()
</script>

<template>
  <main class="page">
    <p v-if="catalogError" class="state">Не удалось загрузить каталог</p>
    <p v-else-if="!catalog" class="state">Загрузка…</p>
    <RouterView v-else />
    <p v-if="notice" class="host-notice" role="status">{{ notice }}</p>
  </main>
</template>
