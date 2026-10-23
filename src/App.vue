<script setup>
import { loadCatalog, catalog, catalogError } from './catalog'
import { host, notice } from './bridge'
import { t } from './i18n'
loadCatalog()
</script>

<template>
  <main class="page" :class="host">
    <p v-if="catalogError" class="state">{{ t('loadError') }}</p>
    <p v-else-if="!catalog" class="state">{{ t('loading') }}</p>
    <RouterView v-else />
    <p v-if="notice" class="host-notice" role="status">{{ notice }}</p>
  </main>
</template>
