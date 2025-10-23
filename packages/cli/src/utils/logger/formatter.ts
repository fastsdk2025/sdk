import { addPrefixZero } from "@/utils/addPrefixZero";

export function formatDate(date: Date, format: string = "YYYY-MM-DD HH:mm:ss") {
  const year = date.getFullYear();
  const month = addPrefixZero(date.getMonth() + 1);
  const day = addPrefixZero(date.getDate());
  const hours = addPrefixZero(date.getHours());
  const minutes = addPrefixZero(date.getMinutes());
  const seconds = addPrefixZero(date.getSeconds());

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}
