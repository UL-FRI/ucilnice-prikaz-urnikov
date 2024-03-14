<script lang="ts" setup>
import UniversityBuilding from './UniversityBuilding.vue';
</script>

<template>
  <div class="background">
    <UniversityBuilding />
  </div>
</template>

<style lang="scss" scoped>
.background :deep(svg) {
  position: absolute;
  top: 14vh;
  left: 0;
  z-index: -1;
  height: 72vh;
  width: auto;
  margin: auto;
}
</style>
