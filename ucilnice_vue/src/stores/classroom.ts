import api from '@/helpers/api';
import { defineStore } from 'pinia';
import { computed, onMounted, ref } from 'vue';

export interface Classroom {
  id: number;
  name: string;
  slug?: string;
}

export interface ReservationsApiClassroomsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReservationsApiClassroom[];
}

export interface ReservationsApiClassroom {
  id: number;
  slug: string;
  type: string;
  name: string;
  nresources_set: ReservationsApiNresourcesSet[];
}

export interface ReservationsApiNresourcesSet {
  id: number;
  resource: ReservationsApiResource;
  n: number;
}

export interface ReservationsApiResource {
  id: number;
  slug: string;
  type: string;
  name: string;
}

export const useClassroomStore = defineStore('classroomStore', () => {
  const classrooms = ref<Classroom[]>([]);

  const currentClassroomSlug = ref<string | null>(null);

  onMounted(async () => {
    await fetchData();
  });

  const setCurrentClassroomBySlug = (slug: string) => {
    currentClassroomSlug.value = slug;
  };

  const currentClassroom = computed(() =>
    classrooms.value.find((c) => c.slug === currentClassroomSlug.value),
  );

  const currentClassroomId = computed(() => currentClassroom.value?.id);

  const fetchData = async () => {
    classrooms.value = [];

    let nextPageUrl: string | null =
      '/sets/rezervacije_fri/types/classroom/reservables/?format=json';

    while (nextPageUrl !== null) {
      const response = await api.get(nextPageUrl);
      const data = response.data as ReservationsApiClassroomsResponse;
      nextPageUrl = data.next;

      data.results.forEach((classroom) => {
        classrooms.value.push({ id: classroom.id, name: classroom.name, slug: classroom.slug });
      });
    }
  };

  return {
    classrooms,
    fetchData,
    currentClassroomSlug,
    currentClassroom,
    setCurrentClassroomBySlug,
    currentClassroomId,
  };
});
