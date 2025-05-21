import { Seat, Group, SeatingChart, SeatType, SeatStatus } from "../types/venue";
import { v4 as uuidv4 } from "uuid";
import { Calendar, CalendarX, User, Users } from "lucide-react";

// Generate the initial seating chart
export const generateSeatingChart = (
  rows: number,
  columns: number,
  vipRows: number[] = [],
  accessibilityColumns: number[] = [],
  ageRestrictedRows: number[] = [],
  elderlyFriendlyRows: number[] = []
): SeatingChart => {
  const seats: Seat[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // Determine seat type based on position
      let type: SeatType = 'regular';
      
      if (vipRows.includes(row)) {
        type = 'vip';
      }
      
      if (accessibilityColumns.includes(col)) {
        type = 'accessibility';
      }

      if (ageRestrictedRows.includes(row)) {
        type = 'age-restricted';
      }

      if (elderlyFriendlyRows.includes(row)) {
        type = 'elderly-friendly';
      }

      // Add some randomness for unavailable seats (about 5%)
      const status = Math.random() > 0.95 ? 'unavailable' as const : 'available' as const;

      seats.push({
        id: `seat-${row}-${col}`,
        row,
        column: col,
        type,
        status,
      });
    }
  }

  return { 
    rows, 
    columns, 
    seats, 
    vipRows, 
    accessibilityColumns,
    ageRestrictedRows,
    elderlyFriendlyRows
  };
};

// Find available seats for a group
export const findSeatsForGroup = (
  chart: SeatingChart,
  groupSize: number,
  requiresVIP: boolean = false,
  requiresAccessibility: boolean = false,
  hasChildren: boolean = false,
  hasElderly: boolean = false,
  adminOverride: boolean = false
): Seat[] => {
  // Add a minimum group size check - don't allow single bookings
  if (groupSize < 2 || groupSize > 7) {
    return [];
  }

  const seats = [...chart.seats];
  const availableSeats = seats.filter(seat => seat.status === 'available' || seat.status === 'reallocated');
  
  // Handle admin override - just find any available seats
  if (adminOverride) {
    return availableSeats.slice(0, groupSize);
  }

  // If accessibility is required, prioritize finding seats in accessibility columns
  if (requiresAccessibility) {
    const accessibilitySeats = availableSeats.filter(seat => seat.type === 'accessibility');
    
    if (accessibilitySeats.length >= groupSize) {
      // Sort by row and column to keep the group close together
      const sortedSeats = accessibilitySeats.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.column - b.column;
      });
      
      return sortedSeats.slice(0, groupSize);
    }
  }

  // Search by rows to keep groups together
  for (let row = 0; row < chart.rows; row++) {
    // Check if the row is suitable according to age restrictions
    if (hasChildren && chart.ageRestrictedRows?.includes(row)) {
      continue; // Skip age-restricted rows if the group has children
    }
    
    // Prioritize elderly-friendly rows if the group has elderly people
    if (hasElderly && !chart.elderlyFriendlyRows?.includes(row) && 
        availableSeats.filter(seat => 
          seat.row === row && 
          chart.elderlyFriendlyRows?.includes(seat.row)
        ).length >= groupSize) {
      continue; // Skip non-elderly-friendly rows if there are enough seats in elderly-friendly rows
    }

    // Filter seats by requirements
    const rowSeats = availableSeats.filter(seat => {
      if (seat.row !== row) return false;
      if (requiresVIP && seat.type !== 'vip') return false;
      if (requiresAccessibility && seat.type !== 'accessibility') return false;
      return true;
    });

    if (rowSeats.length >= groupSize) {
      // Sort seats by column to ensure they're consecutive
      const sortedSeats = rowSeats.sort((a, b) => a.column - b.column);
      
      // Find consecutive seats
      for (let i = 0; i <= sortedSeats.length - groupSize; i++) {
        const potentialGroup = sortedSeats.slice(i, i + groupSize);
        
        // Check if these seats are consecutive
        let isConsecutive = true;
        for (let j = 1; j < potentialGroup.length; j++) {
          if (potentialGroup[j].column !== potentialGroup[j-1].column + 1) {
            isConsecutive = false;
            break;
          }
        }
        
        if (isConsecutive) {
          return potentialGroup;
        }
      }
    }
  }
  
  // If accessibility is required but we haven't found suitable seats yet,
  // try to find any accessible seats even if they're not consecutive
  if (requiresAccessibility) {
    const accessibleSeats = availableSeats.filter(seat => seat.type === 'accessibility');
    if (accessibleSeats.length >= groupSize) {
      return accessibleSeats.slice(0, groupSize);
    }
  }
  
  // No suitable seats found
  return [];
};

// Assign seats to a group
export const assignSeatsToGroup = (
  chart: SeatingChart,
  seats: Seat[],
  groupSize: number,
  hasChildren: boolean = false,
  hasElderly: boolean = false,
  isRescheduled: boolean = false
): { updatedChart: SeatingChart, group: Group } => {
  // Create a deep copy of the chart
  const updatedChart = { ...chart, seats: [...chart.seats] };
  const groupId = uuidv4();
  
  // Mark seats as selected
  const updatedSeats = seats.map(seat => {
    const seatIndex = updatedChart.seats.findIndex(s => s.id === seat.id);
    if (seatIndex !== -1) {
      // Save previous group ID if this is a reallocation
      const previousGroupId = updatedChart.seats[seatIndex].status === 'reallocated' ? 
                             updatedChart.seats[seatIndex].groupId : 
                             undefined;
      
      // Fix: Explicitly use 'selected' as SeatStatus type instead of string
      const updatedSeat: Seat = {
        ...updatedChart.seats[seatIndex],
        status: 'selected' as const,
        groupId,
        previousGroupId
      };
      updatedChart.seats[seatIndex] = updatedSeat;
      return updatedSeat;
    }
    return seat;
  });
  
  // Enforce the "no single seat between groups" rule
  // Check seats adjacent to the group on both sides
  const minCol = Math.min(...seats.map(s => s.column));
  const maxCol = Math.max(...seats.map(s => s.column));
  const row = seats[0].row;
  
  // Skip this rule for VIP seats
  const isVipRow = chart.vipRows?.includes(row) || false;
  if (!isVipRow) {
    if (minCol > 0) {
      // Check left adjacent seat
      const leftAdjacentSeatIndex = updatedChart.seats.findIndex(
        s => s.row === row && s.column === minCol - 1 && s.status === 'available'
      );
      
      if (leftAdjacentSeatIndex !== -1) {
        // Also check one more seat to the left to prevent a single seat isolation
        const leftLeftSeatIndex = updatedChart.seats.findIndex(
          s => s.row === row && s.column === minCol - 2 && s.status === 'available'
        );
        
        if (leftLeftSeatIndex === -1) {
          // Fix: Explicitly use 'unavailable' as SeatStatus type
          updatedChart.seats[leftAdjacentSeatIndex] = {
            ...updatedChart.seats[leftAdjacentSeatIndex],
            status: 'unavailable' as const
          };
        }
      }
    }
    
    if (maxCol < updatedChart.columns - 1) {
      // Check right adjacent seat
      const rightAdjacentSeatIndex = updatedChart.seats.findIndex(
        s => s.row === row && s.column === maxCol + 1 && s.status === 'available'
      );
      
      if (rightAdjacentSeatIndex !== -1) {
        // Also check one more seat to the right to prevent a single seat isolation
        const rightRightSeatIndex = updatedChart.seats.findIndex(
          s => s.row === row && s.column === maxCol + 2 && s.status === 'available'
        );
        
        if (rightRightSeatIndex === -1) {
          // Fix: Explicitly use 'unavailable' as SeatStatus type
          updatedChart.seats[rightAdjacentSeatIndex] = {
            ...updatedChart.seats[rightAdjacentSeatIndex],
            status: 'unavailable' as const
          };
        }
      }
    }
  }
  
  // Create and return the group
  const group: Group = {
    id: groupId,
    size: groupSize,
    seats: updatedSeats,
    isVIP: updatedSeats.some(seat => seat.type === 'vip'),
    requiresAccessibility: updatedSeats.some(seat => seat.type === 'accessibility'),
    hasChildren,
    hasElderly,
    isRescheduled
  };
  
  return { updatedChart, group };
};

// Reset selected seats (cancel a booking)
export const resetSelectedSeats = (chart: SeatingChart): SeatingChart => {
  const updatedSeats = chart.seats.map(seat => {
    if (seat.status === 'selected') {
      return { ...seat, status: 'available' as const, groupId: undefined };
    }
    return seat;
  });
  
  return { ...chart, seats: updatedSeats };
};

// Reschedule a booking (cancel and reallocate seats)
export const rescheduleBooking = (
  chart: SeatingChart,
  groupId: string
): SeatingChart => {
  // Mark the seats as reallocated (available for rebooking, but tracked)
  const updatedSeats = chart.seats.map(seat => {
    if (seat.groupId === groupId && seat.status === 'selected') {
      return { 
        ...seat, 
        status: 'reallocated' as const, 
        previousGroupId: seat.groupId 
      };
    }
    return seat;
  });
  
  return { ...chart, seats: updatedSeats };
};

// Find best seats for elderly
export const findElderlyFriendlySeats = (
  chart: SeatingChart,
  groupSize: number
): Seat[] => {
  // First try to find seats in elderly-friendly rows
  if (chart.elderlyFriendlyRows && chart.elderlyFriendlyRows.length > 0) {
    const elderlyFriendlySeats = chart.seats.filter(
      seat => chart.elderlyFriendlyRows!.includes(seat.row) && seat.status === 'available'
    );
    
    // Sort seats by column to try finding consecutive seats
    const sortedSeats = elderlyFriendlySeats.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.column - b.column;
    });
    
    // Group seats by row
    const seatsByRow: Record<number, Seat[]> = {};
    sortedSeats.forEach(seat => {
      if (!seatsByRow[seat.row]) seatsByRow[seat.row] = [];
      seatsByRow[seat.row].push(seat);
    });
    
    // Look for consecutive seats in each row
    for (const row in seatsByRow) {
      const rowSeats = seatsByRow[row];
      if (rowSeats.length >= groupSize) {
        // Check for consecutive seats
        for (let i = 0; i <= rowSeats.length - groupSize; i++) {
          const potentialGroup = rowSeats.slice(i, i + groupSize);
          let isConsecutive = true;
          for (let j = 1; j < potentialGroup.length; j++) {
            if (potentialGroup[j].column !== potentialGroup[j-1].column + 1) {
              isConsecutive = false;
              break;
            }
          }
          if (isConsecutive) return potentialGroup;
        }
      }
    }
  }
  
  // If no suitable elderly-friendly seats found, fallback to regular seat finding
  return findSeatsForGroup(chart, groupSize, false, true);
};

// Validate if a group with children can be seated in the selected seats
export const validateAgeRestrictions = (
  chart: SeatingChart,
  seats: Seat[],
  hasChildren: boolean
): boolean => {
  if (!hasChildren) return true;
  
  // Check if any of the seats are in age-restricted rows
  return !seats.some(seat => 
    chart.ageRestrictedRows?.includes(seat.row)
  );
};
