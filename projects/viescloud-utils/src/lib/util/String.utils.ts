export class StringUtils {
    private constructor() { }

    static readBlobAsText(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result as string);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read Blob'));
            };

            reader.readAsText(blob);
        });
    }

    static makeId(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    static generateUUID(): string {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
    }

    static getMaxString(str: string, length: number, replaceWith: string = '...'): string {
        if (str.length > length) {
            return str.substring(0, length) + replaceWith;
        }
        return str;
    }

    static getMaxStringReverse(str: string, length: number, replaceWith: string = '...'): string {
      if (str.length > length) {
        return replaceWith + str.substring(str.length - length);
      }

      return str;
    }

  static describeJavaCronExpression(cron: string): string {
    const cronParts = cron.trim().split(' ');

    if (cronParts.length !== 6) {
      return 'Invalid cron expression. A cron expression should have 6 fields: seconds, minutes, hours, day of month, month, and day of week.';
    }

    const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = cronParts;

    // Helper function to interpret individual fields
    const describePart = (part: string, unit: string): string => {
      if (part === '*') return `every ${unit}`;
      if (part.includes('/')) {
        const [base, interval] = part.split('/');
        if (base === '*') {
          return `every ${interval} ${unit}`;
        }
        if (base.includes('-')) {
          const [start, end] = base.split('-');
          return `every ${interval} ${unit} from ${start} to ${end}`;
        }
        return `every ${interval} ${unit}, starting at ${base}`;
      }
      if (part.includes(',')) {
        const values = part.split(',').join(', ');
        return `at ${values} ${unit}`;
      }
      if (part.includes('-')) {
        const [start, end] = part.split('-');
        return `from ${start} to ${end} ${unit}`;
      }
      return `at ${part} ${unit}`;
    };

    // Handle special cases for day of month and day of week
    const describeDayOfMonth = (part: string): string => {
      if (part === '?') return 'any day of the month';
      if (part === 'L') return 'on the last day of the month';
      if (part.endsWith('W')) {
        return `on the nearest weekday to day ${part.slice(0, -1)} of the month`;
      }
      return describePart(part, 'day(s) of the month');
    };

    const describeDayOfWeek = (part: string): string => {
      if (part === '?') return 'any day of the week';
      if (part === 'L') return 'on the last day of the week (Saturday)';
      if (part.includes('#')) {
        const [day, occurrence] = part.split('#');
        return `on the ${occurrence}${StringUtils.getOrdinalSuffix(occurrence)} ${StringUtils.dayOfWeekName(day)} of the month`;
      }
      return describePart(part, 'day(s) of the week');
    };

    const describeMonth = (part: string): string => {
      const monthMap: {[month: string]: string} = {
        '1': 'January', '2': 'February', '3': 'March', '4': 'April',
        '5': 'May', '6': 'June', '7': 'July', '8': 'August',
        '9': 'September', '10': 'October', '11': 'November', '12': 'December',
      };

      if (part === '*') return 'every month';
      if (part in monthMap) return `in ${monthMap[part]}`;
      return describePart(part, 'month(s)');
    };

    const secondDescription = describePart(seconds, 'second(s)');
    const minuteDescription = describePart(minutes, 'minute(s)');
    const hourDescription = describePart(hours, 'hour(s)');
    const dayOfMonthDescription = describeDayOfMonth(dayOfMonth);
    const monthDescription = describeMonth(month);
    const dayOfWeekDescription = describeDayOfWeek(dayOfWeek);

    return `This cron job will execute ${secondDescription}, ${minuteDescription}, ${hourDescription}, ${dayOfMonthDescription}, ${monthDescription}, ${dayOfWeekDescription}.`;
  }

  private static getOrdinalSuffix(num: string): string {
    const n = parseInt(num, 10);
    if ([11, 12, 13].includes(n % 100)) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  private static dayOfWeekName(day: string): string {
    const dayMap: {[day: string]: string} = {
      '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
      '4': 'Thursday', '5': 'Friday', '6': 'Saturday',
    };

    return dayMap[day] || day;
  }
}
