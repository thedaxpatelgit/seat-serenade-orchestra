
import React from 'react';
import { Group } from '../types/venue';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, CalendarX, User, Users } from 'lucide-react';

interface BookingSummaryProps {
  groups: Group[];
  onCancelBooking: (groupId: string) => void;
  onRescheduleBooking: (groupId: string) => void;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({ 
  groups, 
  onCancelBooking,
  onRescheduleBooking
}) => {
  if (groups.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Current Bookings</h3>
        <p className="text-gray-500 text-sm">No bookings have been made yet.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Current Bookings</h3>
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {groups.map((group) => (
            <div 
              key={group.id} 
              className="p-3 border border-gray-200 rounded-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Group of {group.size}</h4>
                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                    <p className="flex flex-wrap gap-2">
                      {group.isVIP && <span className="text-venue-vip font-medium">VIP</span>}
                      {group.requiresAccessibility && (
                        <span className="text-venue-accessibility font-medium">Accessibility</span>
                      )}
                      {group.hasChildren && (
                        <span className="flex items-center text-venue-age-restricted font-medium">
                          <Users size={14} className="mr-1" /> With Children
                        </span>
                      )}
                      {group.hasElderly && (
                        <span className="flex items-center text-venue-elderly-friendly font-medium">
                          <User size={14} className="mr-1" /> With Elderly
                        </span>
                      )}
                      {group.isRescheduled && (
                        <span className="flex items-center text-venue-reallocated font-medium">
                          <Calendar size={14} className="mr-1" /> Rescheduled
                        </span>
                      )}
                    </p>
                    <p>Seats: {group.seats.map(seat => 
                      `${seat.row + 1}${String.fromCharCode(65 + seat.column)}`
                    ).join(', ')}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRescheduleBooking(group.id)}
                    className="flex items-center"
                  >
                    <Calendar size={14} className="mr-1" />
                    Reschedule
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onCancelBooking(group.id)}
                    className="flex items-center"
                  >
                    <CalendarX size={14} className="mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BookingSummary;
