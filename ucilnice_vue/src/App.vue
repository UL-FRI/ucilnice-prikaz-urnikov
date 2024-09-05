<script setup lang="ts">
import UniversityBackground from './components/UniversityBackground.vue';
import { useThemeStore } from './stores/theme';

useThemeStore();
</script>

<template>
  <UniversityBackground />
  <router-view />
</template>

<style lang="scss" scoped></style>
