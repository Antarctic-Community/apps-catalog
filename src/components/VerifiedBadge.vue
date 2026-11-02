<script setup>
import { t } from '../i18n'
import awLogo from '../assets/common/aw-logo.svg'
</script>

<template>
  <img class="badge" :src="awLogo" :alt="t('verified')" />
</template>
