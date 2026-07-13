const LATIN_LOWER = 'abcçdeəfgğhxıijkqlmnoöprsştuüvyz';
const CYRILLIC_LOWER = 'абҹчдеәфҝғһхыижкглмноөпрсштуүвјз';
const LATIN_UPPER = 'ABCÇDEƏFGĞHXIİJKQLMNOÖPRSŞTUÜVYZ';
const CYRILLIC_UPPER = 'АБҸЧДЕӘФҜҒҺХЫИЖКГЛМНОӨПРСШТУҮВЈЗ';

export const AZERBAIJANI_LATIN = `${LATIN_LOWER}${LATIN_UPPER}`;
export const AZERBAIJANI_CYRILLIC = `${CYRILLIC_LOWER}${CYRILLIC_UPPER}`;

const latinToCyrillic = new Map([...AZERBAIJANI_LATIN].map((character, index) => [character, [...AZERBAIJANI_CYRILLIC][index]]));
const cyrillicToLatin = new Map([...AZERBAIJANI_CYRILLIC].map((character, index) => [character, [...AZERBAIJANI_LATIN][index]]));

export function transliterateAzerbaijani(value, direction) {
  const table = direction === 'latin-cyr' ? latinToCyrillic : direction === 'cyr-latin' ? cyrillicToLatin : null;
  if (!table) throw new RangeError('Çevirmə istiqaməti tanınmadı.');
  return [...String(value)].map((character) => table.get(character) ?? character).join('');
}

export const PASSWORD_GROUPS = Object.freeze({
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnopqrstuvwxyz',
  number: '23456789',
  symbol: '!@#$%&*+-=?',
});

function secureRandomIndex(maximum, cryptoSource) {
  if (!cryptoSource || typeof cryptoSource.getRandomValues !== 'function') {
    throw new Error('Kriptoqrafik təsadüfi ədəd mənbəyi mövcud deyil.');
  }
  const range = 0x1_0000_0000;
  const limit = range - (range % maximum);
  const sample = new Uint32Array(1);
  do cryptoSource.getRandomValues(sample); while (sample[0] >= limit);
  return sample[0] % maximum;
}

export function generateSecurePassword({
  length,
  groups,
  cryptoSource = globalThis.crypto,
  minimum = 8,
  maximum = 64,
}) {
  const requestedLength = Number(length);
  if (!Number.isInteger(requestedLength)) throw new RangeError('Parol uzunluğu tam ədəd olmalıdır.');
  if (requestedLength < minimum || requestedLength > maximum) throw new RangeError(`Parol uzunluğu ${minimum}–${maximum} aralığında olmalıdır.`);

  const selected = [...new Set(Array.isArray(groups) ? groups : [])];
  if (!selected.length) throw new RangeError('Ən azı bir simvol qrupu seçin.');
  const unknown = selected.find((key) => !Object.hasOwn(PASSWORD_GROUPS, key));
  if (unknown) throw new RangeError(`Naməlum simvol qrupu: ${unknown}.`);
  if (requestedLength < selected.length) throw new RangeError('Parol uzunluğu seçilmiş qrup sayından az ola bilməz.');

  const characters = selected.map((key) => {
    const pool = PASSWORD_GROUPS[key];
    return pool[secureRandomIndex(pool.length, cryptoSource)];
  });
  const combined = selected.map((key) => PASSWORD_GROUPS[key]).join('');
  while (characters.length < requestedLength) characters.push(combined[secureRandomIndex(combined.length, cryptoSource)]);

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const other = secureRandomIndex(index + 1, cryptoSource);
    [characters[index], characters[other]] = [characters[other], characters[index]];
  }
  return characters.join('');
}

const predictableBases = [
  'password', 'parol', 'qwerty', 'admin', 'welcome', 'letmein', 'salam',
  'azerbaijan', 'azərbaycan', 'baku', 'baki', 'bakı',
];
const sequenceRows = [
  '0123456789', 'abcdefghijklmnopqrstuvwxyz', 'abcçdeəfgğhxıijkqlmnoöprsştuüvyz',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
];

function simplifySubstitutions(value) {
  return value
    .replace(/[@4]/gu, 'a').replace(/[3]/gu, 'e').replace(/[$5]/gu, 's')
    .replace(/[0]/gu, 'o').replace(/[!1|]/gu, 'i').replace(/[7]/gu, 't')
    .replace(/[\s._-]+/gu, '');
}

function hasPredictableBase(value) {
  const simplified = simplifySubstitutions(value);
  return predictableBases.some((base) => simplified === base || (simplified.startsWith(base) && simplified.length - base.length <= 6));
}

function hasSequence(value) {
  const compact = value.replace(/[^\p{L}\p{N}]/gu, '');
  for (const row of sequenceRows) {
    const reverse = [...row].reverse().join('');
    for (let index = 0; index <= compact.length - 4; index += 1) {
      const part = compact.slice(index, index + 4);
      if (row.includes(part) || reverse.includes(part)) return true;
    }
  }
  return false;
}

function hasRepeatedPattern(value, characters) {
  if (/(.)\1{3,}/u.test(value)) return true;
  if (/^(.{1,5})\1{2,}$/u.test(value)) return true;
  return characters.length >= 8 && new Set(characters).size / characters.length < 0.35;
}

export function assessPasswordStrength(value) {
  const password = String(value ?? '');
  const characters = [...password];
  const length = characters.length;
  if (!length) {
    return {
      empty: true, length: 0, score: 0, summary: 'Çox zəif',
      reasons: ['Parol daxil edilməyib.'], suggestions: ['Qiymətləndirmək üçün parol daxil edin.'],
    };
  }

  const normalized = password.normalize('NFKC').toLocaleLowerCase('az');
  const classes = [
    /\p{Lu}/u.test(password), /\p{Ll}/u.test(password), /\p{N}/u.test(password), /[^\p{L}\p{N}\s]/u.test(password),
  ].filter(Boolean).length;
  const words = normalized.trim().split(/\s+/u).filter((word) => [...word].length >= 3);
  const passphrase = words.length >= 4 && new Set(words).size >= 4 && length >= 20;
  const predictable = hasPredictableBase(normalized);
  const repeated = hasRepeatedPattern(normalized, characters);
  const sequential = hasSequence(normalized);
  const dateLike = /(?:19|20)\d{2}/u.test(normalized) && length <= 16;

  let score = length < 8 ? 0 : length < 12 ? 1 : length < 16 ? 2 : length < 20 ? 3 : 4;
  if (length >= 12 && classes >= 3) score = Math.min(4, score + 1);
  if (passphrase) score = Math.max(score, words.length >= 5 ? 4 : 3);

  const reasons = [];
  const suggestions = [];
  if (length < 12) {
    reasons.push('Parol qısadır.');
    suggestions.push('Ən azı 12–16 simvol və ya bir neçə əlaqəsiz söz istifadə edin.');
  }
  if (predictable) {
    score = Math.min(score, 1);
    reasons.push('Geniş yayılmış və ya asan proqnozlaşdırılan söz nümunəsi var.');
    suggestions.push('Ümumi sözə rəqəm və simvol əlavə etməklə kifayətlənməyin.');
  }
  if (repeated) {
    score = Math.min(score, 1);
    reasons.push('Təkrarlanan simvol və ya hissələr parolu proqnozlaşdırılan edir.');
    suggestions.push('Təkrarları fərqli simvol və ya əlaqəsiz sözlərlə əvəz edin.');
  }
  if (sequential) {
    score = Math.min(score, 1);
    reasons.push('Ardıcıl əlifba, rəqəm və ya klaviatura nümunəsi aşkarlandı.');
    suggestions.push('“1234”, “abcd” və “qwerty” kimi ardıcıllıqlardan uzaq durun.');
  }
  if (dateLike) {
    score = Math.min(score, 1);
    reasons.push('Tarix və ya il kimi asan təxmin edilən hissə var.');
    suggestions.push('Doğum ili və digər məlum tarixlərdən istifadə etməyin.');
  }
  if (classes <= 1 && !passphrase) {
    score = Math.min(score, 2);
    reasons.push('Simvol müxtəlifliyi azdır.');
    suggestions.push('Uzunluğu artırın və fərqli simvol qruplarından istifadə edin.');
  }
  if (!reasons.length) {
    reasons.push(passphrase ? 'Bir neçə uzun və fərqli sözdən ibarət passphrase-dir.' : 'Uzunluq və simvol müxtəlifliyi qənaətbəxşdir.');
  }
  if (!suggestions.length) suggestions.push('Hər xidmət üçün fərqli parol istifadə edin və parol menecerində saxlayın.');

  const labels = ['Çox zəif', 'Zəif', 'Orta', 'Kafi görünür', 'Güclü görünür'];
  return { empty: false, length, score, summary: labels[score], reasons, suggestions };
}

function ibanMod97(value) {
  let remainder = 0;
  for (const character of `${value.slice(4)}${value.slice(0, 4)}`) {
    const digits = /[A-Z]/u.test(character) ? String(character.charCodeAt(0) - 55) : character;
    for (const digit of digits) remainder = ((remainder * 10) + Number(digit)) % 97;
  }
  return remainder;
}

export function validateAzIban(value) {
  const normalized = String(value ?? '').replace(/\s+/gu, '').toUpperCase();
  if (!normalized) return { normalized, valid: false, reason: 'empty' };
  if (normalized.length !== 28 || !/^AZ\d{2}/u.test(normalized)) return { normalized, valid: false, reason: 'country-or-length' };
  if (!/^[A-Z]{4}$/u.test(normalized.slice(4, 8))) return { normalized, valid: false, reason: 'bank-identifier' };
  if (!/^[A-Z0-9]{20}$/u.test(normalized.slice(8))) return { normalized, valid: false, reason: 'account-structure' };
  if (ibanMod97(normalized) !== 1) return { normalized, valid: false, reason: 'checksum' };
  return { normalized, valid: true, reason: 'valid' };
}
