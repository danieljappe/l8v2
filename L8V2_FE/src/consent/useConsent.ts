import { useSyncExternalStore } from 'react';
import { isSettingsOpen, readConsent, subscribe } from './consentStore';
import type { ConsentCategoryId } from './registry';

const getConsent = () => readConsent();

/** The visitor's current valid choice, or null if they have not (validly) chosen. */
export function useConsent() {
  return useSyncExternalStore(subscribe, getConsent, () => null);
}

export function useHasConsent(category: ConsentCategoryId): boolean {
  const consent = useConsent();
  return category === 'necessary' || consent?.categories[category] === true;
}

export function useSettingsOpen(): boolean {
  return useSyncExternalStore(subscribe, isSettingsOpen, () => false);
}
