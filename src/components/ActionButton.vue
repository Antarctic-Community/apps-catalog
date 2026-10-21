<script setup>
import { capabilities, isAdded, addApp, openApp } from '../bridge'
import { t } from '../i18n'
defineProps({ app: Object })
</script>

<template>
  <button
    class="pill"
    :class="{ open: !capabilities.canAdd || isAdded(app.id) }"
    @click.stop.prevent="capabilities.canAdd && !isAdded(app.id) ? addApp(app) : openApp(app)"
  >
    {{ capabilities.canAdd && !isAdded(app.id) ? t('add') : t('open') }}
  </button>
</template>
