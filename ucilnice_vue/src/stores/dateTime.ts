import { defineStore, storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import { useConfigurationStore } from './configuration';

export const useDateTimeStore = defineStore('dateTime', () => {
  const dateTimeSimulatorCount = ref(0);

  const configurationStore = useConfigurationStore();
  const { locale } = storeToRefs(configurationStore);

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
  });

  const formatTime = (
    date: Date,
    options: Intl.DateTimeFormatOptions = {
      hour12: false,
      hour: 'numeric',
      minute: 'numeric',
      second: undefined,
    },
  ) => date.toLocaleTimeString(locale.value, options);

  const formatLongDate = (
    date: Date,
    options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    },
  ) => date.toLocaleDateString(locale.value, options);

  const millisecondsBetween = (date1: Date, date2: Date) => date1.getTime() - date2.getTime();

  const shortDayOfWeek = (date: Date) =>
    date.toLocaleDateString(locale.value, { weekday: 'short' });

  const fromToText = (from: Date, to: Date) => {
    if (from.getDate() === to.getDate()) {
      return `${formatTime(from)} - ${formatTime(to)}`;
    }

    return `${formatTime(from)} (${shortDayOfWeek(from)}) - ${formatTime(to)} (${shortDayOfWeek(to)})`;
  };

  const enableSimulation = (start: number, speed: number = 60) => {
    simulationEnabled.value = true;
    simulationStartTime.value = start;

    setInterval(() => {
      dateTimeSimulatorCount.value += speed * 1000;
      currentDateTime.value = getCurrentTime();
    }, 50);
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
