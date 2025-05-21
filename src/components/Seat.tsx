
import React, { useState } from 'react';
import { Seat as SeatType } from '../types/venue';
import { cn } from '@/lib/utils';

interface SeatProps {
  seat: SeatType;
  onSelect: (seat: SeatType) => void;
}

const Seat: React.FC<SeatProps> = ({ seat, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getBackgroundColor = () => {
    // If seat is manually selected, return a distinct color
    if (seat.status === 'selected') return 'bg-blue-600';
    if (seat.status === 'unavailable') return 'bg-venue-unavailable';
    if (seat.status === 'reallocated') return 'bg-venue-reallocated';
    
    // Available seats
    if (seat.type === 'vip') return 'bg-venue-vip';
    if (seat.type === 'accessibility') return 'bg-venue-accessibility';
    if (seat.type === 'age-restricted') return 'bg-venue-age-restricted';
    if (seat.type === 'elderly-friendly') return 'bg-venue-elderly-friendly';
    return 'bg-venue-available';
  };
  
  const isClickable = seat.status !== 'unavailable';
  
  const handleClick = () => {
    if (isClickable) {
      // Add visual feedback with a quick pulse animation
      const element = document.getElementById(`seat-${seat.id}`);
      if (element) {
        element.classList.add('scale-125');
        setTimeout(() => {
          element.classList.remove('scale-125');
        }, 200);
      }
      onSelect(seat);
    }
  };
  
  return (
    <button
      id={`seat-${seat.id}`}
      className={cn(
        'w-10 h-10 rounded m-1 flex items-center justify-center text-xs font-medium transition-all',
        getBackgroundColor(),
        isClickable ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-70',
        // Make age-restricted and elderly-friendly seats have darker text for better contrast
        (seat.type === 'age-restricted' || seat.type === 'elderly-friendly') && seat.status === 'available' ? 'text-gray-800' : 'text-white',
        // Updated visual feedback for selected seats - much thinner black border (0.2px) and reduced ring
        seat.status === 'selected' && 'ring-[0.5px] ring-black ring-opacity-100 shadow-md transform scale-110 border-[0.2px] border-black',
        // Add a pulsating effect when hovered
        isHovered && isClickable && 'animate-pulse'
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={!isClickable}
      title={`${seat.row + 1}${String.fromCharCode(65 + seat.column)} (${seat.type})`}
    >
      {`${seat.row + 1}${String.fromCharCode(65 + seat.column)}`}
    </button>
  );
};

export default Seat;
