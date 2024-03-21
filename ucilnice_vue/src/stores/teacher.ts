import api from '@/helpers/api';
import { defineStore } from 'pinia';
import { onMounted, ref } from 'vue';

export interface Teacher {
  id: number;
  name: string;
}

export interface ReservationsApiTeachersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ReservationsApiTeacher[];
}

export interface ReservationsApiTeacher {
  id: number;
  slug: string;
  type: string;
  name: string;
  nresources_set: any[];
}

export const useTeacherStore = defineStore('teacherStore', () => {
  const teachers = ref<Teacher[]>([]);

  onMounted(() => {
    fetchData();
  });

  const fetchData = async () => {
    teachers.value = [];

    let nextPageUrl: string | null = '/sets/rezervacije_fri/types/teacher/reservables/?format=json';

    while (nextPageUrl !== null) {
      const response = await api.get(nextPageUrl);
      const data = response.data as ReservationsApiTeachersResponse;
      nextPageUrl = data.next;
      data.results.forEach((teacher) => {
        teachers.value.push({ id: teacher.id, name: teacher.name });
      });
    }
  };

  fetchData();

  const getTeacherById = (id: number) => {
    return teachers.value.find((teacher) => teacher.id === id);
  };

  return {
    teachers,
    fetchData,
    getTeacherById,
  };
});
