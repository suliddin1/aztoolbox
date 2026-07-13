import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateLoan,
  calculatePercentage,
  calculateVat,
  collectRegexMatches,
  convertLength,
  dateToTimestamp,
  readFiniteNumber,
  timestampToDate,
} from '../../assets/js/batch3-tools.js';

test('shared numeric parsing distinguishes blank, zero, decimal comma and non-finite values', () => {
  assert.equal(readFiniteNumber('0', { label: 'Dəyər' }), 0);
  assert.equal(readFiniteNumber(' 1,25 ', { label: 'Dəyər' }), 1.25);
  assert.equal(readFiniteNumber('-2.5', { label: 'Dəyər' }), -2.5);
  assert.equal(readFiniteNumber('12,0', { label: 'Ay', integer: true }), 12);
  assert.throws(() => readFiniteNumber('', { label: 'Dəyər' }), /daxil edin/u);
  assert.throws(() => readFiniteNumber('   ', { label: 'Dəyər' }), /daxil edin/u);
  assert.throws(() => readFiniteNumber('NaN', { label: 'Dəyər' }), /rəqəm/u);
  assert.throws(() => readFiniteNumber('Infinity', { label: 'Dəyər' }), /rəqəm/u);
  assert.throws(() => readFiniteNumber('1,2.3', { label: 'Dəyər' }), /rəqəm/u);
  assert.throws(() => readFiniteNumber('-1', { label: 'Dəyər', min: 0 }), /0-dan/u);
  assert.throws(() => readFiniteNumber('1.5', { label: 'Ay', integer: true }), /tam ədəd/u);
});

test('percentage calculator implements both approved modes without calculation rounding', () => {
  assert.deepEqual(calculatePercentage('part', '200', '15'), { mode: 'part', number: 200, percent: 15, value: 30 });
  assert.equal(calculatePercentage('part', '-200', '10').value, -20);
  assert.equal(calculatePercentage('part', '100', '0,333333333333').value, 0.333333333333);
  assert.deepEqual(calculatePercentage('change', '100', '120'), { mode: 'change', from: 100, to: 120, value: 20, direction: 'artım' });
  assert.equal(calculatePercentage('change', '100', '80').direction, 'azalma');
  assert.equal(calculatePercentage('change', '100', '100').direction, 'dəyişiklik yoxdur');
  assert.throws(() => calculatePercentage('change', '0', '10'), /böyük olmalıdır/u);
  assert.throws(() => calculatePercentage('change', '-10', '20'), /0-dan/u);
  assert.throws(() => calculatePercentage('part', '', '10'), /Ədəd daxil edin/u);
});

test('VAT and length formulas preserve valid zero and reject invalid domains', () => {
  assert.deepEqual(calculateVat('100', '18', 'add'), { amount: 100, ratePercent: 18, vat: 18, total: 118 });
  const extracted = calculateVat('118', '18', 'extract');
  assert.ok(Math.abs(extracted.vat - 18) < 1e-12);
  assert.equal(extracted.total, 118);
  assert.equal(calculateVat('0', '18', 'add').total, 0);
  assert.equal(convertLength('1,5', 'km', 'm'), 1500);
  assert.equal(convertLength('0', 'm', 'km'), 0);
  assert.throws(() => calculateVat('', '18', 'add'), /Məbləğ daxil edin/u);
  assert.throws(() => calculateVat('-1', '18', 'add'), /0-dan/u);
  assert.throws(() => convertLength('-1', 'm', 'km'), /0-dan/u);
  assert.throws(() => convertLength('Infinity', 'm', 'km'), /rəqəm/u);
});

test('loan calculations match an independent amortization formula including zero interest', () => {
  const principal = 10_000;
  const annualRate = 12;
  const months = 12;
  const monthlyRate = annualRate / 1200;
  const expected = principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
  const result = calculateLoan(String(principal), String(annualRate), String(months));
  assert.ok(Math.abs(result.payment - expected) < 1e-9);
  assert.ok(Math.abs(result.total - expected * months) < 1e-8);
  assert.ok(Math.abs(result.interest - (expected * months - principal)) < 1e-8);
  assert.equal(calculateLoan('1200', '0', '12').payment, 100);
  assert.equal(calculateLoan('1200,50', '6,5', '24').months, 24);
  assert.ok(Number.isFinite(calculateLoan('250000', '7.5', '360').payment));
  for (const values of [['', '5', '12'], ['1000', '-1', '12'], ['1000', '5', '0'], ['1000', '5', '12.5'], ['1000', '5', '1201'], ['1e308', '1000', '1200']]) {
    assert.throws(() => calculateLoan(...values));
  }
});

test('timestamp conversion uses explicit units and validates the Date range', () => {
  assert.equal(timestampToDate('0', 'seconds').toISOString(), '1970-01-01T00:00:00.000Z');
  assert.equal(timestampToDate('-2208988800', 'seconds').toISOString(), '1900-01-01T00:00:00.000Z');
  assert.equal(timestampToDate('1000', 'milliseconds').toISOString(), '1970-01-01T00:00:01.000Z');
  assert.equal(dateToTimestamp('1970-01-01T00:00:01.000Z', 'seconds'), 1);
  assert.equal(dateToTimestamp('1970-01-01T00:00:01.000Z', 'milliseconds'), 1000);
  assert.throws(() => timestampToDate('not-a-number', 'seconds'), /rəqəm/u);
  assert.throws(() => timestampToDate('1e20', 'milliseconds'), /etibarlı tarix/u);
  assert.throws(() => dateToTimestamp('invalid-date', 'seconds'), /düzgün deyil/u);
  assert.throws(() => dateToTimestamp('', 'seconds'), /daxil edin/u);
});

test('regex matching supports flags, groups, non-global and zero-length progress', () => {
  assert.deepEqual(collectRegexMatches('a', 'i', 'A a').matches.map((match) => match.index), [0]);
  const grouped = collectRegexMatches('(a)(?<digit>\\d)', 'gi', 'a1 A2');
  assert.deepEqual(grouped.matches.map((match) => match.groups), [['a', '1'], ['A', '2']]);
  assert.deepEqual(grouped.matches.map((match) => match.namedGroups), [{ digit: '1' }, { digit: '2' }]);
  assert.deepEqual(collectRegexMatches('(?=.)', 'gu', '😀a').matches.map((match) => match.index), [0, 2]);
  assert.deepEqual(collectRegexMatches('.', 'y', 'ab').matches.map((match) => match.value), ['a', 'b']);
  assert.equal(collectRegexMatches('z', '', 'abc').matches.length, 0);
  assert.throws(() => collectRegexMatches('(', '', 'abc'), SyntaxError);
  assert.throws(() => collectRegexMatches('a', 'gg', 'abc'), SyntaxError);
});
