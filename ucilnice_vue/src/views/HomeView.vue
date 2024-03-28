<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CurrentSubject from '../components/CurrentSubject.vue';
import FriLogo from '../components/FriLogo.vue';
import PageFooter from '../components/PageFooter.vue';
import SideTimeline from '../components/SideTimeline.vue';
import { useClassroomStore } from '../stores/classroom';
import { useDateTimeStore } from '@/stores/dateTime';
import { useReservationStore } from '@/stores/reservation';
import { storeToRefs } from 'pinia';
import { DataStatus } from '@/stores/configuration';

const route = useRoute();
const router = useRouter();
const classroomStore = useClassroomStore();
const dateTimeStore = useDateTimeStore();
const reservationStore = useReservationStore();
const { status, reservations } = storeToRefs(reservationStore);

onMounted(() => {
  const { room, simulate, speed } = route.query;

  const classroom = room?.toString();

  if (!classroom) {
    router.push({ name: 'SelectClassroom' });
    return;
  }

  if (simulate) {
    dateTimeStore.enableSimulation(
      new Date(simulate.toString()).getTime() || new Date().getTime(),
      speed ? parseInt(speed.toString()) : 60,
    );
  }

  classroomStore.setCurrentClassroomBySlug(classroom);
});
</script>

<template>
  <div class="page-wrapper">
    <main>
      <FriLogo />

      <CurrentSubject v-if="status === DataStatus.loaded || reservations.length >= 1" />
      <h1 v-else-if="status === DataStatus.loading">Nalaganje ...</h1>
      <h1 v-else-if="status === DataStatus.error">Napaka pri nalaganju urnika</h1>
      <h1 v-else-if="status === DataStatus.init">Inicializacija ...</h1>

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
