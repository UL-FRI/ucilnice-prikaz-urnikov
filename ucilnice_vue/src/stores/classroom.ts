import { defineStore, storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { useConfigurationStore } from './configuration';
import api from '@/helpers/api';
import type { ReservationsApiClassroomsResponse } from '@/helpers/api.d';

export interface Classroom {
  id: number;
  name: string;
  slug?: string;
}

export const useClassroomStore = defineStore('classroomStore', () => {
  const classrooms = ref<Classroom[]>([]);

  const currentClassroomSlug = ref<string | null>(null);

  const configurationStore = useConfigurationStore();
  const { lastConfigurationUpdate, classroomsRefreshFrequency, ipUrl, classroomIpMappings } =
    storeToRefs(configurationStore);

  let refreshInterval: number | null = null;

  onMounted(async () => {
    await fetchData();
    setRefreshInterval();
  });

  const setRefreshInterval = () => {
    if (refreshInterval !== null) {
      clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(fetchData, classroomsRefreshFrequency.value * 60 * 1000);
  };

  watch(lastConfigurationUpdate, async () => {
    await fetchData();
    setRefreshInterval();
  });

  const setCurrentClassroomBySlug = (slug: string) => {
    currentClassroomSlug.value = slug;
  };

  const currentClassroom = computed(() =>
    classrooms.value.find((c) => c.slug === currentClassroomSlug.value),
  );

  const currentClassroomId = computed(() => currentClassroom.value?.id);

  watch(lastConfigurationUpdate, async () => {
    await fetchData();
  });

  const fetchData = async () => {
    let nextPageUrl: string | null =
      '/sets/rezervacije_fri/types/classroom/reservables/?format=json';

    const newData: Classroom[] = [];
    while (nextPageUrl !== null) {
      const response = await api.get(nextPageUrl);
      const data = response.data as ReservationsApiClassroomsResponse;
      nextPageUrl = data.next;

      data.results.forEach((classroom) => {
        newData.push({ id: classroom.id, name: classroom.name, slug: classroom.slug });
      });
    }

    classrooms.value = newData;
  };

  const autoConfigureClassroom = async () => {
    const { data } = await api.get(ipUrl.value);

    const classromSlug = classroomIpMappings.value[data.ip];

    if (classromSlug) {
      setCurrentClassroomBySlug(classromSlug);
    }

    return classromSlug;
  };

  return {
    classrooms,
    fetchData,
    currentClassroomSlug,
    currentClassroom,
    setCurrentClassroomBySlug,
    currentClassroomId,
    autoConfigureClassroom,
  };
});
