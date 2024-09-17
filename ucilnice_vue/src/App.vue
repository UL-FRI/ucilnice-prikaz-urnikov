<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useThemeStore } from '@/stores/theme';
import { useClassroomStore } from '@/stores/classroom';
import { useDateTimeStore } from '@/stores/dateTime';
import { useReservationStore } from '@/stores/reservation';
import { DataStatus, useConfigurationStore } from '@/stores/configuration';

import UniversityBackground from '@/components/UniversityBackground.vue';
import CurrentSubject from '@/components/CurrentSubject.vue';
import FriLogo from '@/components/FriLogo.vue';
import PageFooter from '@/components/PageFooter.vue';
import SideTimeline from '@/components/SideTimeline.vue';
import ClassroomPicker from './components/ClassroomPicker.vue';

const configurationStore = useConfigurationStore();
const classroomStore = useClassroomStore();
const dateTimeStore = useDateTimeStore();
const reservationStore = useReservationStore();
const { status, reservations } = storeToRefs(reservationStore);

const showClassroomPicker = ref(false);

onMounted(async () => {
  await configurationStore.refreshConfiguration();

  const urlParams = new URLSearchParams(window.location.search);

  const room = urlParams.get('room');
  const simulate = urlParams.get('simulate');
  const speed = urlParams.get('speed');

  if (simulate) {
    dateTimeStore.enableSimulation(
      new Date(simulate.toString()).getTime() || new Date().getTime(),
      speed ? parseInt(speed.toString()) : 60,
    );
  }

  const classroom = room?.toString();

  if (classroom) {
    classroomStore.setCurrentClassroomBySlug(classroom);
  } else {
    status.value = DataStatus.classroomDiscovery;

    const autoConfigureResult = await classroomStore.autoConfigureClassroom();

    if (!autoConfigureResult) {
      showClassroomPicker.value = true;
      setTimeout(() => {
        window.location.reload();
      }, 60 * 1000);
    }
  }
});

useThemeStore();
</script>

<template>
  <UniversityBackground />
  <div class="page-wrapper">
    <main>
      <FriLogo />

      <ClassroomPicker v-if="showClassroomPicker" />
      <CurrentSubject
        v-else-if="
          status === DataStatus.loaded || status === DataStatus.updating || reservations.length >= 1
        "
      />
      <h1 v-else-if="status === DataStatus.loading">Nalaganje ...</h1>
      <h1 v-else-if="status === DataStatus.error">Napaka pri pridobivanju podatkov</h1>
      <h1 v-else-if="status === DataStatus.classroomDiscovery">Prepoznavanje učilnice ...</h1>
      <h1 v-else-if="status === DataStatus.classroomNotDiscovered">
        Napaka pri prepoznavi učilnice
      </h1>
      <h1 v-else-if="status === DataStatus.init">Inicializacija ...</h1>

      <PageFooter @showPicker="showClassroomPicker = true" />
    </main>
    <SideTimeline />
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.select-classroom-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  width: max-content;
  color: $gray-dark;
  font-size: 1.5rem;

  &:hover {
    text-decoration: underline;
  }
}
</style>
