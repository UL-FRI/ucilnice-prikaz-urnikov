<script lang="ts" setup>
import { computed } from 'vue';
import { useClassroomStore } from '@/stores/classroom';
import { storeToRefs } from 'pinia';
import { useDateTimeStore } from '@/stores/dateTime';
import { useReservationStore } from '@/stores/reservation';
import { DataStatus } from '@/stores/configuration';

const dateTimeStore = useDateTimeStore();
const { currentDateTime } = storeToRefs(dateTimeStore);

const currentTime = computed(() => dateTimeStore.formatTime(currentDateTime.value));
const currentDate = computed(() => dateTimeStore.formatLongDate(currentDateTime.value));

const classroomStore = useClassroomStore();
const { currentClassroom } = storeToRefs(classroomStore);

const reservationStore = useReservationStore();
const { status } = storeToRefs(reservationStore);
</script>

<template>
  <div class="footer-wrapper">
    <div class="footer">
      <div class="error" v-if="status == DataStatus.error">!</div>
      <div class="classroom">{{ currentClassroom?.slug }}</div>
      <div class="datetime">
        <div class="time">{{ currentTime }}</div>
        <div class="date">{{ currentDate }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.footer-wrapper {
  min-height: 16vh;
  display: flex;
  align-items: flex-end;

  .footer {
    display: flex;
    align-items: center;
    color: $gray-dark;

    .error {
      font-size: 3rem;
      margin-right: 1rem;
    }

    .classroom {
      font-size: 3rem;
    }

    .datetime {
      display: flex;
      flex-direction: column;
      justify-content: center;

      margin-left: 1.25rem;
      padding-left: 1.25rem;

      border-left: 0.2rem solid $gray-dark;

      .time {
        font-size: 2rem;
        font-weight: 700;
      }

      .date {
        font-size: 1.75rem;
      }
    }
  }
}
</style>
