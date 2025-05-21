
export type SeatType = 'regular' | 'vip' | 'accessibility' | 'age-restricted' | 'elderly-friendly';
export type SeatStatus = 'available' | 'selected' | 'unavailable' | 'reallocated';

export interface Seat {
  id: string;
  row: number;
  column: number;
  type: SeatType;
  status: SeatStatus;
  groupId?: string;
  previousGroupId?: string; // For tracking reallocation history
}

export interface SeatingChart {
  rows: number;
  columns: number;
  seats: Seat[];
  vipRows?: number[];
  accessibilityColumns?: number[];
  ageRestrictedRows?: number[];
  elderlyFriendlyRows?: number[];
}

export interface Group {
  id: string;
  size: number;
  seats: Seat[];
  isVIP?: boolean;
  requiresAccessibility?: boolean;
  hasChildren?: boolean;
  hasElderly?: boolean;
  isRescheduled?: boolean;
}
