import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AZERBAIJANI_CYRILLIC,
  AZERBAIJANI_LATIN,
  PASSWORD_GROUPS,
  assessPasswordStrength,
  generateSecurePassword,
  transliterateAzerbaijani,
  validateAzIban,
} from '../../assets/js/batch2-tools.js';

const hasGroup = (value, key) => [...value].some((character) => PASSWORD_GROUPS[key].includes(character));

test('Azerbaijani transliteration uses the complete reviewed alphabet table in both directions', () => {
  assert.equal(transliterateAzerbaijani(AZERBAIJANI_LATIN, 'latin-cyr'), AZERBAIJANI_CYRILLIC);
  assert.equal(transliterateAzerbaijani(AZERBAIJANI_CYRILLIC, 'cyr-latin'), AZERBAIJANI_LATIN);
  assert.equal(transliterateAzerbaijani(AZERBAIJANI_LATIN, 'latin-cyr').includes('undefined'), false);

  const sentence = 'Gəncə, Bakı və Şuşa — 2026! g/q/j/y; G/Q/J/Y.';
  const converted = transliterateAzerbaijani(sentence, 'latin-cyr');
  assert.match(converted, /Ҝәнҹә/u);
  assert.match(converted, /ҝ\/г\/ж\/ј/u);
  assert.equal(transliterateAzerbaijani(converted, 'cyr-latin'), sentence);
  assert.equal(transliterateAzerbaijani('Щ, ё, №, 😀', 'cyr-latin'), 'Щ, ё, №, 😀');
  assert.throws(() => transliterateAzerbaijani('mətn', 'unsupported'), /istiqamət/u);
});

test('password generator guarantees every selected group across all 15 combinations and 10,000 samples', () => {
  const keys = Object.keys(PASSWORD_GROUPS);
  let samples = 0;
  for (let mask = 1; mask < 16; mask += 1) {
    const groups = keys.filter((_, index) => (mask & (1 << index)) !== 0);
    const count = mask === 15 ? 9_300 : 50;
    for (let index = 0; index < count; index += 1) {
      const value = generateSecurePassword({ length: 8, groups });
      assert.equal(value.length, 8);
      groups.forEach((group) => assert.equal(hasGroup(value, group), true, `${group} missing for mask ${mask}`));
      samples += 1;
    }
  }
  assert.equal(samples, 10_000);

  const maximum = generateSecurePassword({ length: 64, groups: keys });
  assert.equal(maximum.length, 64);
  keys.forEach((group) => assert.equal(hasGroup(maximum, group), true));
});

test('password generator validates selection and length and exclusively uses the supplied cryptographic source', () => {
  assert.throws(() => generateSecurePassword({ length: 8, groups: [] }), /simvol qrupu/u);
  assert.throws(() => generateSecurePassword({ length: 7, groups: ['upper'] }), /8.*64/u);
  assert.throws(() => generateSecurePassword({ length: 65, groups: ['upper'] }), /8.*64/u);
  assert.throws(() => generateSecurePassword({ length: 8.5, groups: ['upper'] }), /tam ədəd/u);
  assert.throws(() => generateSecurePassword({ length: 3, groups: ['upper', 'lower', 'number', 'symbol'], minimum: 1 }), /qrup sayından/u);
  assert.throws(() => generateSecurePassword({ length: 8, groups: ['unknown'] }), /Naməlum/u);

  let calls = 0;
  let state = 0;
  const cryptoSource = {
    getRandomValues(array) {
      calls += 1;
      for (let index = 0; index < array.length; index += 1) {
        state = (state + 2_654_435_761) >>> 0;
        array[index] = state;
      }
      return array;
    },
  };
  const value = generateSecurePassword({ length: 32, groups: ['upper', 'lower', 'number', 'symbol'], cryptoSource });
  assert.equal(value.length, 32);
  assert.ok(calls >= 32, 'selection and shuffle must obtain random values from WebCrypto-compatible getRandomValues');
});

test('password strength model is conservative for common, repeated, sequential and substituted patterns', () => {
  const weakCorpus = [
    'password',
    'Password1234!',
    'P@ssw0rd!',
    'qwerty123!',
    '1234567890',
    'abc123456',
    'aaaaaaaaAAAA1111!!!!',
    'Abcd1234!',
    'Azərbaycan2026!',
  ];
  for (const value of weakCorpus) {
    const assessment = assessPasswordStrength(value);
    assert.ok(assessment.score <= 1, `${value} was scored ${assessment.score}: ${assessment.reasons.join('; ')}`);
    assert.ok(assessment.reasons.length > 0);
    assert.ok(assessment.suggestions.length > 0);
  }

  const passphrase = assessPasswordStrength('narıncı dəniz sakit külək fənər');
  assert.ok(passphrase.score >= 3, JSON.stringify(passphrase));
  assert.match(passphrase.summary, /güclü/i);

  const randomLike = assessPasswordStrength('T7!vQ2#nL9@zR4%kW8&c');
  assert.ok(randomLike.score >= 3, JSON.stringify(randomLike));
  assert.equal(assessPasswordStrength('').empty, true);
  assert.equal(assessPasswordStrength('Şifrə😀Şifrə😀').length, 12);
});

test('AZ IBAN validator enforces 4 letters plus 20 alphanumeric BBAN characters before MOD-97', () => {
  const officialExample = 'AZ21NABZ00000000137010001944';
  assert.deepEqual(validateAzIban(officialExample), {
    normalized: officialExample,
    valid: true,
    reason: 'valid',
  });
  assert.equal(validateAzIban('az21 nabz 0000 0000 1370 1000 1944').valid, true);
  assert.equal(validateAzIban('AZ97000000000000000000000000').reason, 'bank-identifier');
  assert.equal(validateAzIban('AZ20NABZ00000000137010001944').reason, 'checksum');
  assert.equal(validateAzIban('AZ21NABZ0000000013701000194_').reason, 'account-structure');
  assert.equal(validateAzIban('').reason, 'empty');
  assert.equal(validateAzIban('TR21NABZ00000000137010001944').reason, 'country-or-length');
});
