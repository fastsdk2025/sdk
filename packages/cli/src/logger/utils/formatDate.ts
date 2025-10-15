function addZero(num: number): string {
  return String(num < 10 ? "0" + num : num);
}

export function formatDate(date: Date, format: string = "YYYY-MM-DD HH:mm:ss"): string {
  const year = String(date.getFullYear());
  const month = addZero(date.getMonth() + 1);
  const day = addZero(date.getDate());
  const hour = addZero(date.getHours());
  const minute = addZero(date.getMinutes());
  const second = addZero(date.getSeconds());

  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hour)
    .replace("mm", minute)
    .replace("ss", second);
}