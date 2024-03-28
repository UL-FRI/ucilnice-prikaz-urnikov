import { defineStore, storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import { useConfigurationStore, type Interval } from './configuration';
import { useDateTimeStore } from './dateTime';

export enum Theme {
  light,
  dark,
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(Theme.light);

  const configurationStore = useConfigurationStore();
  const { darkModeStart, darkModeEnd } = storeToRefs(configurationStore);

  const dateTimeStore = useDateTimeStore();
  const { currentDateTime } = storeToRefs(dateTimeStore);

  const updateDarkMode = () => {
    const time = currentDateTime.value;
    const minutesSinceMidnight = time.getHours() * 60 + time.getMinutes();

    const darkModeIntervals: Interval[] = [];

    if (
      darkModeStart.value === darkModeEnd.value ||
      darkModeStart.value < 0 ||
      darkModeEnd.value < 0
    ) {
      if (theme.value === Theme.dark) {
        setTheme(Theme.light);
      }
      return;
    } else if (darkModeStart.value < darkModeEnd.value) {
      darkModeIntervals.push({ start: darkModeStart.value, end: darkModeEnd.value });
    } else {
      darkModeIntervals.push(
        { start: 0, end: darkModeEnd.value },
        { start: darkModeStart.value, end: 24 * 60 },
      );
    }

    const isInInterval = darkModeIntervals.some(
      (interval) => minutesSinceMidnight >= interval.start && minutesSinceMidnight < interval.end,
    );

    if (isInInterval && theme.value === Theme.light) {
      setTheme(Theme.dark);
    } else if (!isInInterval && theme.value === Theme.dark) {
      setTheme(Theme.light);
    }
  };

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;

    const newColorScheme = newTheme === Theme.light ? 'light' : 'dark';
    document.documentElement.setAttribute('color-scheme', newColorScheme);

    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', newColorScheme);
    }
  };

  onMounted(() => {
    updateDarkMode();
  });

  watch([currentDateTime, darkModeStart, darkModeEnd], () => {
    updateDarkMode();
  });

  return {
    theme,
    setTheme,
  };
});
