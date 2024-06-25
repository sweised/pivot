import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toSignificantFigures(
  stringWithDecimal: string,
  significantFigures: number
) {
  const periodIndex = stringWithDecimal.indexOf(".");

  if (periodIndex < 0) {
    return `${stringWithDecimal}.00`;
  }
  return stringWithDecimal.slice(0, periodIndex + significantFigures + 1);
}
