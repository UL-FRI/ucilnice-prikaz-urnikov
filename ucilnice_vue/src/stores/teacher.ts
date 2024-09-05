import { defineStore, storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import type { ReservationsApiTeachersResponse } from '../helpers/api.d';
import api from '../helpers/api';
import { useConfigurationStore } from './configuration';

export interface Teacher {
  id: number;
  name: string;
}

export const useTeacherStore = defineStore('teacherStore', () => {
  const teachers = ref<Teacher[]>([]);

  const configurationStore = useConfigurationStore();
  const { lastConfigurationUpdate, teachersRefreshFrequency } = storeToRefs(configurationStore);

  let refreshInterval: number | null = null;

  onMounted(async () => {
    setRefreshInterval();
  });

  const setRefreshInterval = () => {
    if (refreshInterval !== null) {
      clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(fetchData, teachersRefreshFrequency.value * 60 * 1000);
  };

  watch(lastConfigurationUpdate, async () => {
    await fetchData();
    setRefreshInterval();
  });

  const fetchData = async () => {
    const newTeachers: Teacher[] = [];

    let nextPageUrl: string | null = '/sets/rezervacije_fri/types/teacher/reservables/?format=json';

    while (nextPageUrl !== null) {
      const response = await api.get(nextPageUrl);
      const data = response.data as ReservationsApiTeachersResponse;
      nextPageUrl = data.next;
      data.results.forEach((teacher) => {
        newTeachers.push({ id: teacher.id, name: teacher.name });
      });
    }

    teachers.value = newTeachers;
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
