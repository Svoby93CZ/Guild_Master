import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Identifikátor pro předměty, hrdiny a záznamy v deníku.
 *
 * Sedm znaků z `Math.random` začne při tisících předmětů kolidovat, takže se
 * použije `crypto.randomUUID`, kde je k dispozici (starší prohlížeče a
 * nezabezpečený kontext spadnou zpět na původní postup).
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};
