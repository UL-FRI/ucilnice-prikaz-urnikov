import constants from '@/constants';
import { defineStore, storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import { Theme, useThemeStore } from './theme';

export const useDateTimeStore = defineStore('dateTime', () => {
  const dateTimeSimulatorCount = ref(0);

  const themeStore = useThemeStore();
  const { theme } = storeToRefs(themeStore);

  const simulationEnabled = ref(false);
  const simulationStartTime = ref(new Date().getTime());

  const getCurrentTime = () =>
    simulationEnabled.value
      ? new Date(simulationStartTime.value + dateTimeSimulatorCount.value)
      : new Date();

  const currentDateTime = ref(getCurrentTime());

  const currentDate = ref(
    new Date(
      currentDateTime.value.getFullYear(),
      currentDateTime.value.getMonth(),
      currentDateTime.value.getDate(),
    ),
  );

  watch(currentDateTime, (v, p) => {
    if (v.getDate() !== p.getDate()) {
      currentDate.value = new Date(v.getFullYear(), v.getMonth(), v.getDate());
    }

    if (v.getHours() >= 19) {
      if (theme.value === Theme.light) {
        themeStore.setTheme(Theme.dark);
      }
    } else if (v.getHours() >= 6 && theme.value === Theme.dark) {
      themeStore.setTheme(Theme.light);
    }
  });

  onMounted(() => {
    setTimeout(
      () => {
        currentDateTime.value = getCurrentTime();

        setInterval(() => {
          currentDateTime.value = getCurrentTime();
        }, 60 * 1000);
      },
      (60 - currentDateTime.value.getSeconds()) * 1000,
    );

    setInterval(() => {
      dateTimeSimulatorCount.value += 60 * 1000;
      currentDateTime.value = getCurrentTime();
    }, 50);
  });

  const formatTime = (
    date: Date,
    options: Intl.DateTimeFormatOptions = {
      hour12: false,
      hour: 'numeric',
      minute: 'numeric',
      second: undefined,
    },
  ) => date.toLocaleTimeString(constants.locale, options);

  const formatLongDate = (
    date: Date,
    options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    },
  ) => date.toLocaleDateString(constants.locale, options);

  const millisecondsBetween = (date1: Date, date2: Date) => date1.getTime() - date2.getTime();

  const shortDayOfWeek = (date: Date) =>
    date.toLocaleDateString(constants.locale, { weekday: 'short' });

  const fromToText = (from: Date, to: Date) => {
    if (from.getDate() === to.getDate()) {
      return `${formatTime(from)} - ${formatTime(to)}`;
    }

    return `${formatTime(from)} (${shortDayOfWeek(from)}) - ${formatTime(to)} (${shortDayOfWeek(to)})`;
  };

  const enableSimulation = () => {
    simulationEnabled.value = true;
  };

  return {
    currentDateTime,
    currentDate,
    formatTime,
    formatLongDate,
    millisecondsBetween,
    fromToText,
    enableSimulation,
  };
});
