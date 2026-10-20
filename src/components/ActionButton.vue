<script setup>
import { capabilities, isAdded, addApp, openApp } from '../bridge'
defineProps({ app: Object })
</script>

<template>
  <button
    class="pill"
    :class="{ open: !capabilities.canAdd || isAdded(app.id) }"
    @click.stop.prevent="capabilities.canAdd && !isAdded(app.id) ? addApp(app) : openApp(app)"
  >
    {{ capabilities.canAdd && !isAdded(app.id) ? 'Добавить' : 'Открыть' }}
  </button>
</template>
