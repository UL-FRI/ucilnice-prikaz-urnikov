<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CurrentSubject from '../components/CurrentSubject.vue';
import FriLogo from '../components/FriLogo.vue';
import PageFooter from '../components/PageFooter.vue';
import SideTimeline from '../components/SideTimeline.vue';
import { useClassroomStore } from '../stores/classroom';
import { useDateTimeStore } from '@/stores/dateTime';

const route = useRoute();
const router = useRouter();
const classroomStore = useClassroomStore();
const dateTimeStore = useDateTimeStore();

onMounted(() => {
  const { room, simulate } = route.query;

  const classroom = room?.toString();

  if (!classroom) {
    router.push({ name: 'SelectClassroom' });
    return;
  }

  if (simulate) {
    dateTimeStore.enableSimulation();
  }

  classroomStore.setCurrentClassroomBySlug(classroom);
});
</script>

<template>
  <div class="page-wrapper">
    <main>
      <FriLogo />
      <CurrentSubject />
      <PageFooter />
    </main>
    <SideTimeline />
  </div>
</template>

<style lang="scss" scoped>
.page-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 0 2rem 4rem;
  height: 100vh;
}
main {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  overflow: hidden;
  padding-right: 4rem;
}
</style>
