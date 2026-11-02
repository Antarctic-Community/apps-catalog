<script setup>
import ActionButton from "./ActionButton.vue";
import VerifiedBadge from "./VerifiedBadge.vue";
defineProps({ app: Object, rank: Number });
</script>

<template>
  <RouterLink class="row" :to="{ name: 'app', params: { id: app.id } }">
    <span v-if="rank" class="rank">{{ String(rank).padStart(2, "0") }}</span>
    <span class="icon-box">
      <img class="icon" :src="app.icon" :alt="app.name" loading="lazy" />
      <VerifiedBadge v-if="app.verified" />
    </span>
    <span class="row-text">
      <span class="row-name">{{ app.name }}</span>
      <span class="row-tag">{{ app.tagline }}</span>
    </span>
    <ActionButton :app="app" />
  </RouterLink>
</template>
