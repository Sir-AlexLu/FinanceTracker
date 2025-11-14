export function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getYearStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function getYearEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function formatSettlementPeriod(date: Date, type: 'monthly' | 'yearly'): string {
  if (type === 'yearly') {
    return date.getFullYear().toString();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function formatDate(date: Date, format: string = 'DD/MM/YYYY'): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return format.replace('DD', day).replace('MM', month).replace('YYYY', String(year));
}
