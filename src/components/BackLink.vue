<script setup>
import { host } from '../bridge'
import { t } from '../i18n'

defineProps({ to: { type: [String, Object], required: true } })
</script>

<template>
  <RouterLink v-if="host !== 'wallet'" :to="to" class="round" :aria-label="t('back')">
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M12.8 4.7 7.4 10l5.4 5.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </RouterLink>
</template>
