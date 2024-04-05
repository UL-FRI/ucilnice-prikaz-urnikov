import api from '@/helpers/api';
import axios from 'axios';
import { defineStore } from 'pinia';
import { onMounted, ref } from 'vue';

export enum DataStatus {
  init,
  loading,
  updating,
  loaded,
  error,
}

export interface Interval {
  start: number;
  end: number;
}

export const useConfigurationStore = defineStore('configuration', () => {
  const locale = ref('sl-SI');
  const reasonPattern = ref('(.*)\\s*\\((.*)\\)_(LV|AV|P)');
  const reasonDisplayFormat = ref('$1 $3');

  const apiUrl = ref('');
  const breakSlug = ref('');

  // Refresh frequencies in minutes
  const configurationRefreshFrequency = ref(10);
  const reservationsRefreshFrequency = ref(5);
  const teachersRefreshFrequency = ref(1440);
  const classroomsRefreshFrequency = ref(1440);
  const pageRefreshFrequency = ref(1440);

  // Minutes since midnight
  const darkModeStart = ref(20 * 60);
  const darkModeEnd = ref(6 * 60);

  const lastConfigurationUpdate = ref(new Date());

  let previousResponse = '';

  let configurationRefreshInterval: number | null = null;
  let pageReloadInterval: number | null = null;

  const refreshConfiguration = async () => {
    const { data } = await axios.get(`${import.meta.env.BASE_URL}/configuration.json`);

    const newData = JSON.stringify(data);

    if (previousResponse === newData) {
      return;
    }

    previousResponse = newData;
    lastConfigurationUpdate.value = new Date();

    locale.value = data.locale;
    reasonPattern.value = data.reasonPattern;
    reasonDisplayFormat.value = data.reasonDisplayFormat;

    apiUrl.value = data.apiUrl;
    breakSlug.value = data.breakSlug;
    darkModeStart.value = data.darkMode.start;
    darkModeEnd.value = data.darkMode.end;

    const intervals = data.refreshIntervalsInMinutes;

    configurationRefreshFrequency.value = intervals.configuration;
    reservationsRefreshFrequency.value = intervals.reservations;
    teachersRefreshFrequency.value = intervals.teachers;
    classroomsRefreshFrequency.value = intervals.classrooms;
    pageRefreshFrequency.value = intervals.page;

    api.defaults.baseURL = data.apiUrl;

    if (configurationRefreshInterval != null) {
      clearInterval(configurationRefreshInterval);
    }

    configurationRefreshInterval = setInterval(
      refreshConfiguration,
      configurationRefreshFrequency.value * 60 * 1000,
    );

    if (pageReloadInterval != null) {
      clearInterval(pageReloadInterval);
    }

    pageReloadInterval = setInterval(reloadPage, pageRefreshFrequency.value * 60 * 1000);
  };

  const reloadPage = () => {
    location.reload();
  };

  onMounted(() => {
    refreshConfiguration();
  });

  return {
    locale,
    reasonPattern,
    reasonDisplayFormat,
    apiUrl,
    breakSlug,
    configurationRefreshFrequency,
    reservationsRefreshFrequency,
    teachersRefreshFrequency,
    classroomsRefreshFrequency,
    pageRefreshFrequency,
    darkModeStart,
    darkModeEnd,
    lastConfigurationUpdate,
  };
});
