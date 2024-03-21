export interface PluralFormats {
  one: string;
  two: string;
  few: string;
  many: string;
}

export function useLanguage() {
  const applySlovenePlural = (count: number, { one, two, few, many }: PluralFormats) => {
    const remainder = count % 100;

    if (remainder === 1) return one;
    if (remainder === 2) return two;
    if (remainder === 3 || remainder === 4) return few;

    return many;
  };

  const pluralDatabase = {
    minuta: { one: 'minuta', two: 'minuti', few: 'minute', many: 'minut' },
    minuto: { one: 'minuto', two: 'minuti', few: 'minute', many: 'minut' },
    ura: { one: 'ura', two: 'uri', few: 'ure', many: 'ur' },
    uro: { one: 'uro', two: 'uri', few: 'ure', many: 'ur' },
  };

  const breakLengthText = (start: Date, end: Date) => {
    const differenceInMinutes = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(differenceInMinutes / 60);
    const minutes = differenceInMinutes % 60;

    if (hours < 1) {
      return `${minutes} ${applySlovenePlural(minutes, pluralDatabase.minuto)}`;
    }

    if (minutes === 0) {
      return `${hours} ${applySlovenePlural(hours, pluralDatabase.uro)}`;
    }

    return `${hours} ${applySlovenePlural(hours, pluralDatabase.uro)} ${minutes} ${applySlovenePlural(minutes, pluralDatabase.minuto)}`;
  };

  return { applySlovenePlural, pluralDatabase, breakLengthText };
}
