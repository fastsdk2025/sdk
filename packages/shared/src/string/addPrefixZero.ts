export function addPrefixZero(num: number, length: number = 2) {
  return String(num).padStart(length, '0');
}