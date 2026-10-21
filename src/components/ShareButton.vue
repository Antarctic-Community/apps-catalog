<script setup>
import { ref } from 'vue'
import { shareApp } from '../bridge'
import { t } from '../i18n'
const props = defineProps({ app: Object })
const copied = ref(false)

async function share() {
  if ((await shareApp(props.app)) === 'copied') {
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  }
}
</script>

<template>
  <button class="square" :aria-label="t('share')" @click="share">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3v12M8 7l4-4 4 4M7 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H17" />
    </svg>
    <span v-if="copied" class="toast" role="status">{{ t('copied') }}</span>
  </button>
</template>
