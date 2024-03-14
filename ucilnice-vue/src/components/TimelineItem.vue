<script lang="ts" setup>
import { useLanguage } from '@/helpers/language';
import type { Reservation } from '@/stores/reservation';
import { computed } from 'vue';
import constants from '@/constants';
import { useDateTimeStore } from '@/stores/dateTime';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  reservation: Reservation;
}>();

const dateTimeStore = useDateTimeStore();
const { currentDateTime } = storeToRefs(dateTimeStore);

const { breakLengthText } = useLanguage();

const timeText = computed(() =>
  dateTimeStore.fromToText(props.reservation.start, props.reservation.end),
);

const isBreak = computed(() => props.reservation.subject === constants.breakSlug);

const isCurrent = computed(() => {
  return (
    props.reservation.start <= currentDateTime.value &&
    props.reservation.end > currentDateTime.value
  );
});

const isPast = computed(() => {
  return props.reservation.end <= currentDateTime.value;
});

const breakText = computed(() => {
  if (
    (props.reservation.start.getHours() === 0 && props.reservation.start.getMinutes() === 0) ||
    (props.reservation.end.getHours() === 23 && props.reservation.end.getMinutes() === 59)
  ) {
    return `Prosto`;
  }

  return `Prosto ${breakLengthText(props.reservation.start, props.reservation.end)}`;
});
</script>
<template>
  <div
    v-if="isBreak"
    class="timeline-item is-break"
    :class="{ 'is-current': isCurrent, 'is-past': isPast }"
  >
    <p class="time">{{ timeText }}</p>
    <h3>{{ breakText }}</h3>
  </div>
  <div v-else class="timeline-item" :class="{ 'is-current': isCurrent, 'is-past': isPast }">
    <p class="time">{{ timeText }}</p>
    <h3>{{ reservation.subject }}</h3>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.timeline-item {
  $timeline-line-width: 0.1rem;


  padding-right: 2rem;
  padding-left: 2rem + $timeline-line-width;

  display: flex;
  flex-direction: column;
  justify-content: center;

  transition: 0.3s ease-in-out;

  .time {
    font-size: 1.75rem;
    font-weight: 700;
    color: $gray-dark;
  }

  h3 {
    font-size: 2rem;
    font-style: normal;
    font-weight: 400;
    text-wrap: balance;
  }

  &.is-past {
    opacity: 0.7;
  }

  &.is-current {
    .time {
      color: $primary;
    }

    h3 {
      font-weight: 700;
    }

    &.is-break {
      color: $green;
      font-weight: 700;

      .time {
        color: $green;
        opacity: 0.7;
      }
    }
  }

  &.is-break {
    font-size: 2rem;
    color: $gray-light;

    .time {
      color: $gray-light;
    }
  }
}
</style>
