import constants from '@/constants';
import api from '@/helpers/api';
import { defineStore, storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useClassroomStore } from './classroom';
import { useDateTimeStore } from './dateTime';

export interface Reservation {
  start: Date;
  end: Date;
  teacherIds: number[];
  classrooms: string[];
  subject: string;
}

export interface ReservationsApiReservationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReservationsApiReservation[];
}

export interface ReservationsApiReservation {
  reason: string;
  start: string;
  end: string;
  owners: any[];
  reservables: number[];
  requirements: any[];
  id: number;
}

export const useReservationStore = defineStore('reservationStore', () => {
  const dateTimeStore = useDateTimeStore();

  const { currentDate, currentDateTime } = storeToRefs(dateTimeStore);

  const classroomStore = useClassroomStore();

  const { currentClassroomId } = storeToRefs(classroomStore);

  watch([currentClassroomId, currentDate], () => {
    fetchData();
  });

  onMounted(() => {
    fetchData();
  });

  const beautifyReservationReason = (title: string) =>
    title
      .replace(/\(.*\)_LV/g, ' LV')
      .replace(/\(.*\)_AV/g, ' AV')
      .replace(/\(.*\)_P/g, ' P');

  const fetchData = async () => {
    if (!currentClassroomId.value) {
      return;
    }

    const start = currentDate.value.toISOString();
    const end = new Date(currentDate.value.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const response = await api.get(
      `/reservations/?start=${start}&end=${end}&reservables=${currentClassroomId.value}&format=json`,
    );

    const data = response.data as ReservationsApiReservationsResponse;

    const parsedData: Reservation[] = data.results.map((r) => ({
      subject: beautifyReservationReason(r.reason),
      teacherIds: [...r.owners.map((o) => o.id), ...r.reservables.map((r) => r)],
      start: new Date(r.start),
      end: new Date(r.end),
      classrooms: [],
    }));

    reservations.value = parsedData.sort((a, b) => a.start.getTime() - b.start.getTime());
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
        subject: constants.breakSlug,
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
        subject: constants.breakSlug,
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
        subject: constants.breakSlug,
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

  const isCurrentlyBreak = computed(
    () => currentReservation.value?.subject === constants.breakSlug,
  );

  return {
    reservations,
    reservationsWithBreaks,
    currentReservationIndex,
    currentReservation,
    nextReservation,
    isCurrentlyBreak,
    fetchData,
  };
});
