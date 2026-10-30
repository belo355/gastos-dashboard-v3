import { describe, expect, it } from 'vitest';
import {
  addMonths,
  currentMonth,
  dateToExcelSerial,
  excelSerialToDate,
  formatDate,
  formatMonthLabel,
  formatMonthName,
  isValidDate,
  isValidMonth,
  lastDayOfMonth,
  monthKey,
  parseDateCell,
  today,
} from './dates';

describe('datas', () => {
  it('today usa a data local', () => {
    expect(today(new Date(2026, 9, 29, 23, 59))).toBe('2026-10-29');
    expect(today(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
    expect(currentMonth(new Date(2026, 9, 29))).toBe('2026-10');
  });

  it('valida datas reais', () => {
    expect(isValidDate('2026-10-29')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('29/10/2026')).toBe(false);
    expect(isValidDate(20261029)).toBe(false);
    expect(isValidMonth('2026-10')).toBe(true);
    expect(isValidMonth('2026-13')).toBe(false);
  });

  it('meses', () => {
    expect(monthKey('2026-10-29')).toBe('2026-10');
    expect(addMonths('2026-10', 1)).toBe('2026-11');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-10', -22)).toBe('2024-12');
    expect(formatMonthLabel('2026-10')).toBe('Outubro 2026');
    expect(formatMonthName('2026-03')).toBe('março');
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28');
  });

  it('formata dd/mm/aaaa', () => {
    expect(formatDate('2026-10-29')).toBe('29/10/2026');
  });

  it('parseDateCell aceita Date, serial e texto', () => {
    expect(parseDateCell(new Date(Date.UTC(2026, 9, 29)))).toBe('2026-10-29');
    expect(parseDateCell(new Date('x'))).toBeNull();
    expect(parseDateCell(46324)).toBe('2026-10-29');
    expect(parseDateCell(-1)).toBeNull();
    expect(parseDateCell('29/10/2026')).toBe('2026-10-29');
    expect(parseDateCell(' 2026-10-29 ')).toBe('2026-10-29');
    expect(parseDateCell('1/2/2026')).toBe('2026-02-01');
    expect(parseDateCell('31/02/2026')).toBeNull();
    expect(parseDateCell('2026-02-31')).toBeNull();
    expect(parseDateCell('ontem')).toBeNull();
    expect(parseDateCell(null)).toBeNull();
  });

  it('serial do Excel ida e volta', () => {
    expect(excelSerialToDate(46324)).toBe('2026-10-29');
    expect(dateToExcelSerial('2026-10-29')).toBe(46324);
    expect(excelSerialToDate(0)).toBeNull();
  });
});
