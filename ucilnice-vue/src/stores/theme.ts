import { defineStore } from 'pinia';
import { ref } from 'vue';

export enum Theme {
  light,
  dark,
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(Theme.light);

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;

    const newColorScheme = newTheme === Theme.light ? 'light' : 'dark';
    document.documentElement.setAttribute('color-scheme', newColorScheme);

    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', newColorScheme);
    }
  };

  return {
    theme,
    setTheme,
  };
});
