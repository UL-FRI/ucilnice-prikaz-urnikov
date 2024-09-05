<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useReservationStore } from '@/stores/reservation';
import { storeToRefs } from 'pinia';
import { useTeacherStore } from '@/stores/teacher';
import { useLanguage } from '@/helpers/language';
import { useDateTimeStore } from '@/stores/dateTime';
import { useConfigurationStore } from '@/stores/configuration';

const configurationStore = useConfigurationStore();
const { breakSlug } = storeToRefs(configurationStore);

const dateTimeStore = useDateTimeStore();
const { currentDateTime } = storeToRefs(dateTimeStore);

const reservationStore = useReservationStore();
const teacherStore = useTeacherStore();

const { currentReservation, nextReservation } = storeToRefs(reservationStore);

const isBreak = computed(
  () => currentReservation.value?.subject === breakSlug.value || !currentReservation.value,
);

const timeText = computed(() =>
  currentReservation.value
    ? dateTimeStore.fromToText(currentReservation.value.start, currentReservation.value.end)
    : '',
);

const { breakLengthText } = useLanguage();

const teachersText = computed(() =>
  currentReservation.value?.teacherIds
    .map((e) => teacherStore.getTeacherById(e))
    .filter((e) => e)
    .map((e) => e?.name)
    .join(', '),
);

const isNotLastBreak = computed(
  () =>
    isBreak.value &&
    !(
      (currentReservation.value?.end.getHours() === 23 &&
        currentReservation.value?.end.getMinutes() === 59) ||
      !currentReservation.value
    ),
);

const subText = computed(() => {
  if (!isBreak.value) {
    return teachersText.value;
  }

  if (
    (currentReservation.value?.end.getHours() === 23 &&
      currentReservation.value?.end.getMinutes() === 59) ||
    !currentReservation.value
  ) {
    return '';
  }

  return `Čez ${breakLengthText(currentDateTime.value, currentReservation.value?.end)}:`;
});

const subSubText = computed(() => {
  if (isNotLastBreak.value) {
    return nextReservation.value?.subject;
  }
  return '';
});

const fadeIn = ref(false);

watch(currentReservation, async () => {
  fadeIn.value = true;

  setTimeout(() => {
    fadeIn.value = false;
  }, 1000);
});
</script>
<template>
  <div class="current-subject" :class="{ 'is-break': isBreak, 'fade-in': fadeIn }">
    <p class="time" v-if="!isBreak">{{ timeText }}</p>
    <h1>{{ isBreak ? 'PROSTO' : currentReservation?.subject }}</h1>
    <h2 :class="{ 'is-break': isBreak }">{{ subText }}</h2>
    <h2 class="sub-sub-text">{{ subSubText }}</h2>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

@keyframes fade-in {
  from {
    opacity: 0;
    margin-top: 12rem;
  }
  to {
    opacity: 1;
  }
}

.current-subject {
  width: 100%;
  overflow: hidden;
  text-wrap: balance;

  &.fade-in {
    animation: fade-in 0.5s ease-in-out;
  }

  .time {
    font-size: 3rem;
    color: $primary;
    font-weight: 700;
  }

  h1 {
    font-size: 5rem;
    color: $black;
    font-weight: 700;
    margin: 1rem 0;
  }

  h2 {
    font-size: 3rem;
    color: $gray-dark;

    &.is-break {
      margin-top: 3rem;

      &:empty {
        display: none;
      }
    }
  }

  .sub-sub-text {
    font-weight: 500;
    font-size: 4.5rem;
  }

  &.is-break {
    .time {
      color: $gray-dark;
    }

    h1 {
      color: $green;
    }
  }
}
</style>
