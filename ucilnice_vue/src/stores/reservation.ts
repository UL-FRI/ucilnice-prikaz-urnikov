import { defineStore, storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useClassroomStore } from './classroom';
import { useDateTimeStore } from './dateTime';
import { DataStatus, useConfigurationStore } from './configuration';
import type { ReservationsApiReservationsResponse } from '../helpers/api.d';
import api from '@/helpers/api';

export interface Reservation {
  start: Date;
  end: Date;
  teacherIds: number[];
  classrooms: string[];
  subject: string;
}

export const useReservationStore = defineStore('reservationStore', () => {
  const configurationStore = useConfigurationStore();
  const {
    breakSlug,
    lastConfigurationUpdate,
    reservationsRefreshFrequency,
    reasonPattern,
    reasonDisplayFormat,
  } = storeToRefs(configurationStore);

  const dateTimeStore = useDateTimeStore();
  const { currentDate, currentDateTime } = storeToRefs(dateTimeStore);

  const classroomStore = useClassroomStore();
  const { currentClassroomId } = storeToRefs(classroomStore);

  const status = ref<DataStatus>(DataStatus.init);

  const previousResponse = ref('');

  let refreshInterval: number | null = null;

  onMounted(async () => {
    await fetchData();
    setRefreshInterval();
  });

  const setRefreshInterval = () => {
    if (refreshInterval !== null) {
      clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(fetchData, reservationsRefreshFrequency.value * 60 * 1000);
  };

  watch(lastConfigurationUpdate, async () => {
    await fetchData();
    setRefreshInterval();
  });

  watch([currentClassroomId, currentDate], () => {
    reservations.value = [];
    status.value = DataStatus.init;
    fetchData();
  });

  const beautifyReservationReason = (title: string) =>
    title.replace(RegExp(reasonPattern.value, 'g'), reasonDisplayFormat.value);

  const fetchData = async () => {
    if (!currentClassroomId.value) {
      return;
    }

    status.value = status.value === DataStatus.loaded ? DataStatus.updating : DataStatus.loading;

    const start = currentDate.value.toISOString();
    const end = new Date(currentDate.value.getTime() + 24 * 60 * 60 * 1000).toISOString();

    try {
      const response = await api.get(
        `/reservations/?start=${start}&end=${end}&reservables=${currentClassroomId.value}&format=json`,
      );

      const data = response.data as ReservationsApiReservationsResponse;

      if (JSON.stringify(data) === previousResponse.value) {
        status.value = DataStatus.loaded;
        return;
      }

      const parsedData: Reservation[] = data.results.map((r) => ({
        subject: beautifyReservationReason(r.reason),
        teacherIds: [...r.owners.map((o) => o.id), ...r.reservables.map((r) => r)],
        start: new Date(r.start),
        end: new Date(r.end),
        classrooms: [],
      }));

      reservations.value = parsedData.sort((a, b) => a.start.getTime() - b.start.getTime());

      previousResponse.value = JSON.stringify(data);

      status.value = DataStatus.loaded;
    } catch (error) {
      reservations.value = reservations.value.filter((r) => r.end > currentDate.value);
      status.value = DataStatus.error;
    }
  };

  const reservations = ref<Reservation[]>([]);

  const reservationsWithBreaks = computed(() => {
    const itemsWithBreaks: Reservation[] = [];

    if (reservations.value.length === 0) {
      return itemsWithBreaks;
    }

    // Add a break at the beginning of the day if the first event doesn't start at or before the midnight
    if (
      reservations.value[0].start.getDate() == currentDate.value.getDate() &&
      (reservations.value[0].start.getHours() != 0 || reservations.value[0].start.getMinutes() != 0)
    ) {
      itemsWithBreaks.push({
        subject: breakSlug.value,
        teacherIds: [],
        start: currentDate.value,
        end: reservations.value[0].start,
        classrooms: [],
      });
    }

    for (let i = 0; i < reservations.value.length; i++) {
      itemsWithBreaks.push(reservations.value[i]);

      if (
        i >= reservations.value.length - 1 ||
        dateTimeStore.millisecondsBetween(
          reservations.value[i + 1].start,
          reservations.value[i].end,
        ) <
          60 * 1000
      ) {
        continue;
      }

      itemsWithBreaks.push({
        subject: breakSlug.value,
        teacherIds: [],
        start: reservations.value[i].end,
        end: reservations.value[i + 1].start,
        classrooms: [],
      });
    }

    const lastItem = reservations.value[reservations.value.length - 1];

    // Add a break at the end of the day if the last event doesn't end at or after the midnight
    if (lastItem.end.getDate() == currentDate.value.getDate()) {
      itemsWithBreaks.push({
        subject: breakSlug.value,
        teacherIds: [],
        start: lastItem.end,
        end: new Date(
          lastItem.end.getFullYear(),
          lastItem.end.getMonth(),
          lastItem.end.getDate(),
          23,
          59,
        ),
        classrooms: [],
      });
    }

    return itemsWithBreaks;
  });

  const currentReservationIndex = computed(() =>
    reservationsWithBreaks.value.findIndex(
      (r) => r.end > currentDateTime.value && r.start <= currentDateTime.value,
    ),
  );

  const currentReservation = computed(
    () => reservationsWithBreaks.value[currentReservationIndex.value],
  );

  const nextReservation = computed(
    () => reservationsWithBreaks.value[currentReservationIndex.value + 1],
  );

  const isCurrentlyBreak = computed(() => currentReservation.value?.subject === breakSlug.value);

  return {
    reservations,
    reservationsWithBreaks,
    currentReservationIndex,
    currentReservation,
    nextReservation,
    isCurrentlyBreak,
    fetchData,
    status,
  };
});
