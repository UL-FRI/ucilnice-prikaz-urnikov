<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import TimelineItem from './TimelineItem.vue';
import { useReservationStore } from '@/stores/reservation';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useDateTimeStore } from '@/stores/dateTime';

const dateTimeStore = useDateTimeStore();
const { currentDate } = storeToRefs(dateTimeStore);

const reservationStore = useReservationStore();

const { reservationsWithBreaks, currentReservationIndex, isCurrentlyBreak } =
  storeToRefs(reservationStore);

const timeline = ref<HTMLElement | null>(null);

const elements = ref<HTMLElement[]>([]);

const barTop = ref(0);
const barHeight = ref(0);

let scrollInterval: number | null = null;

onMounted(() => {
  recalculateBar();
});

const checkOverflows = () => {
  if (!timeline.value) {
    return;
  }

  const shouldScroll = timeline.value.scrollHeight > timeline.value.clientHeight;

  if (shouldScroll && scrollInterval == null) {
    scrollInterval = setInterval(() => {
      timeline.value?.scrollTo({
        top: timeline.value?.scrollTop === 0 ? timeline.value.scrollHeight : 0,
        behavior: 'smooth',
      });
    }, 5000);
  } else if (!shouldScroll && scrollInterval != null) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

const recalculateBar = async () => {
  await nextTick();

  if (!timeline.value) {
    barHeight.value = 0;
    return;
  }

  const currentItem = elements.value[currentReservationIndex.value];
  if (!currentItem) {
    barHeight.value = 0;
    return;
  }

  checkOverflows();

  let spaceBetween = 0;
  if (currentReservationIndex.value === 0) {
    const el = elements.value[currentReservationIndex.value + 1];
    if (el) {
      spaceBetween = el.getBoundingClientRect().top - currentItem.getBoundingClientRect().bottom;
    }
  } else {
    const el = elements.value[currentReservationIndex.value - 1];
    if (el) {
      spaceBetween = currentItem.getBoundingClientRect().top - el.getBoundingClientRect().bottom;
    }
  }

  barHeight.value = Math.min(currentItem.clientHeight + spaceBetween - 16, 9 * 16);

  const offset = barHeight.value - currentItem.clientHeight;

  barTop.value =
    currentItem.getBoundingClientRect().top -
    timeline.value.getBoundingClientRect().top +
    timeline.value.scrollTop -
    offset / 2;
};

watch([currentReservationIndex, currentDate, elements], recalculateBar);
</script>

<template>
  <div class="timeline-wrapper" v-if="reservationsWithBreaks.length > 0">
    <div class="timeline" ref="timeline">
      <div class="timeline-items">
        <div
          :key="i"
          v-for="(r, i) in reservationsWithBreaks"
          ref="elements"
          class="timeline-item-wrapper"
        >
          <TimelineItem :reservation="r" />
        </div>
        <div
          class="timeline-current-line"
          :class="{ 'is-break': isCurrentlyBreak }"
          :style="`top: ${barTop}px; min-height: ${barHeight}px;`"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.timeline-wrapper {
  width: 45%;
  height: 100%;
  border-left: 0.1rem solid $gray-dark;

  overflow: hidden;
}

.timeline {
  height: 100%;
  overflow: scroll;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.timeline-items {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 1rem 0;
  min-height: 100%;
  overflow: visible;
}

.timeline-current-line {
  $border-width: 0.375rem;
  min-width: $border-width;
  min-height: 6rem;
  position: absolute;
  background-color: $primary;
  transition: 0.3s;
  &.is-break {
    background-color: $green;
  }
}

.timeline-item-wrapper {
  height: 100%;
  max-height: 9rem;

  display: flex;
  flex-direction: column;
  justify-content: center;

  margin: 0.5rem 0;
}
</style>
