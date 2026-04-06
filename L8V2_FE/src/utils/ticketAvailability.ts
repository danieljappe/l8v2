import type { Event } from '../services/api';

export type AvailabilityStatus = 'sold_out' | 'low' | 'available' | 'unknown';

export function getAvailabilityStatus(billettoData: Event['billettoData']): AvailabilityStatus {
  if (!billettoData || billettoData.ticketsAvailable == null) return 'unknown';
  if (billettoData.ticketsAvailable === 0) return 'sold_out';
  if (billettoData.maxCapacity && billettoData.ticketsAvailable / billettoData.maxCapacity <= 0.5) return 'low';
  return 'available';
}
