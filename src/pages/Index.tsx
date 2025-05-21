import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Seat, SeatingChart as SeatingChartType, Group } from '../types/venue';
import { 
  generateSeatingChart, 
  findSeatsForGroup, 
  assignSeatsToGroup, 
  resetSelectedSeats,
  rescheduleBooking,
  findElderlyFriendlySeats,
  validateAgeRestrictions
} from '../utils/seatingAlgorithm';
import SeatingChart from '../components/SeatingChart';
import SeatingControls from '../components/SeatingControls';
import BookingSummary from '../components/BookingSummary';

// Create initial chart configuration
const ROWS = 10;
const COLUMNS = 12;
const VIP_ROWS = [0, 1]; // First two rows are VIP
const ACCESSIBILITY_COLUMNS = [0, 11]; // First and last columns are accessibility
const AGE_RESTRICTED_ROWS = [8, 9]; // Last two rows are age-restricted
const ELDERLY_FRIENDLY_ROWS = [2, 3]; // Rows 3-4 are elderly-friendly
const MIN_GROUP_SIZE = 2; // Define minimum group size constant

const Index = () => {
  const [chart, setChart] = useState<SeatingChartType>(
    generateSeatingChart(
      ROWS, 
      COLUMNS, 
      VIP_ROWS, 
      ACCESSIBILITY_COLUMNS, 
      AGE_RESTRICTED_ROWS, 
      ELDERLY_FRIENDLY_ROWS
    )
  );
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [bookings, setBookings] = useState<Group[]>([]);
  
  // Handle seat selection
  const handleSeatSelect = (seat: Seat) => {
    const isAlreadySelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };
  
  // Find seats for a group
  const handleFindSeats = (
    groupSize: number,
    requiresVIP: boolean,
    requiresAccessibility: boolean,
    hasChildren: boolean,
    hasElderly: boolean,
    adminOverride: boolean
  ) => {
    // Add validation for minimum group size
    if (groupSize < MIN_GROUP_SIZE) {
      toast({
        title: "Group Size Error",
        description: `Minimum group size is ${MIN_GROUP_SIZE} people.`,
        variant: "destructive"
      });
      return;
    }
    
    // Reset any previously selected seats
    handleClearSelection();
    
    // Use elderly-friendly seating algorithm if needed
    const foundSeats = hasElderly 
      ? findElderlyFriendlySeats(chart, groupSize)
      : findSeatsForGroup(
          chart,
          groupSize,
          requiresVIP,
          requiresAccessibility,
          hasChildren,
          hasElderly,
          adminOverride
        );
    
    if (foundSeats.length === 0) {
      toast({
        title: "No Available Seats",
        description: "Could not find suitable seats for your group. Try different requirements or use admin override.",
        variant: "destructive"
      });
      return;
    }
    
    // Check age restrictions
    if (hasChildren && !adminOverride) {
      const isValidForChildren = validateAgeRestrictions(chart, foundSeats, hasChildren);
      if (!isValidForChildren) {
        toast({
          title: "Age Restriction",
          description: "These seats are in an age-restricted area. Children are not allowed.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Update chart to show selected seats
    const updatedChart = { ...chart };
    foundSeats.forEach(seat => {
      const seatIndex = updatedChart.seats.findIndex(s => s.id === seat.id);
      if (seatIndex !== -1) {
        updatedChart.seats[seatIndex] = {
          ...updatedChart.seats[seatIndex],
          status: 'selected' as const
        };
      }
    });
    
    setChart(updatedChart);
    setSelectedSeats(foundSeats);
    
    toast({
      title: "Seats Found",
      description: `Found ${foundSeats.length} seats for your group.`,
    });
  };
  
  // Clear selected seats
  const handleClearSelection = () => {
    const updatedChart = resetSelectedSeats(chart);
    setChart(updatedChart);
    setSelectedSeats([]);
  };
  
  // Confirm booking
  const handleConfirmBooking = (hasChildren: boolean, hasElderly: boolean) => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No Seats Selected",
        description: "Please select seats before confirming.",
        variant: "destructive"
      });
      return;
    }
    
    // Add validation for minimum group size here too
    if (selectedSeats.length < MIN_GROUP_SIZE) {
      toast({
        title: "Group Size Error",
        description: `Minimum group size is ${MIN_GROUP_SIZE} people.`,
        variant: "destructive"
      });
      return;
    }
    
    // Add age restriction validation for manually selected seats
    if (hasChildren) {
      const isValidForChildren = validateAgeRestrictions(chart, selectedSeats, hasChildren);
      if (!isValidForChildren) {
        toast({
          title: "Age Restriction",
          description: "These seats are in an age-restricted area. Children are not allowed.",
          variant: "destructive"
        });
        return;
      }
    }
    
    const { updatedChart, group } = assignSeatsToGroup(
      chart,
      selectedSeats,
      selectedSeats.length,
      hasChildren,
      hasElderly
    );
    
    setChart(updatedChart);
    setBookings([...bookings, group]);
    setSelectedSeats([]);
    
    toast({
      title: "Booking Confirmed",
      description: `Successfully booked ${group.seats.length} seats.`,
    });
  };
  
  // Cancel a booking
  const handleCancelBooking = (groupId: string) => {
    // Find the group to cancel
    const groupToCancel = bookings.find(group => group.id === groupId);
    
    if (!groupToCancel) return;
    
    // Update the seats status
    const updatedChart = { ...chart };
    groupToCancel.seats.forEach(seat => {
      const seatIndex = updatedChart.seats.findIndex(s => s.id === seat.id);
      if (seatIndex !== -1) {
        updatedChart.seats[seatIndex] = {
          ...updatedChart.seats[seatIndex],
          status: 'available' as const,
          groupId: undefined
        };
      }
    });
    
    setChart(updatedChart);
    setBookings(bookings.filter(group => group.id !== groupId));
    
    toast({
      title: "Booking Cancelled",
      description: `Successfully cancelled booking for ${groupToCancel.seats.length} seats.`,
    });
  };
  
  // Reschedule a booking
  const handleRescheduleBooking = (groupId: string) => {
    // Find the group to reschedule
    const groupToReschedule = bookings.find(group => group.id === groupId);
    
    if (!groupToReschedule) return;
    
    // Mark seats as reallocated
    const updatedChart = rescheduleBooking(chart, groupId);
    setChart(updatedChart);
    setBookings(bookings.filter(group => group.id !== groupId));
    
    toast({
      title: "Booking Rescheduled",
      description: `The booking has been marked for rescheduling. You can now select new seats.`,
    });
    
    // Automatically try to find new seats for this group
    const foundSeats = findSeatsForGroup(
      updatedChart,
      groupToReschedule.size,
      groupToReschedule.isVIP || false,
      groupToReschedule.requiresAccessibility || false,
      groupToReschedule.hasChildren || false,
      groupToReschedule.hasElderly || false,
      false
    );
    
    if (foundSeats.length > 0) {
      // Update chart to show selected seats
      foundSeats.forEach(seat => {
        const seatIndex = updatedChart.seats.findIndex(s => s.id === seat.id);
        if (seatIndex !== -1) {
          updatedChart.seats[seatIndex] = {
            ...updatedChart.seats[seatIndex],
            status: 'selected' as const
          };
        }
      });
      
      setSelectedSeats(foundSeats);
      setChart(updatedChart);
      
      toast({
        title: "Alternate Seats Found",
        description: `Found ${foundSeats.length} alternative seats. Please confirm the rebooking.`,
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-venue-header text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Cinema Seating System</h1>
          <p className="text-sm opacity-75">Prototype Seating Algorithm</p>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar: Seating controls */}
          <div className="lg:col-span-1">
            <SeatingControls 
              onFindSeats={handleFindSeats}
              onClearSelection={handleClearSelection}
              onConfirmBooking={handleConfirmBooking}
              selectedSeatsCount={selectedSeats.length}
              maxGroupSize={7}
            />
            
            <div className="mt-6">
              <BookingSummary 
                groups={bookings}
                onCancelBooking={handleCancelBooking}
                onRescheduleBooking={handleRescheduleBooking}
              />
            </div>
          </div>
          
          {/* Main area: Seating chart */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <SeatingChart 
                    chart={chart} 
                    onSeatSelect={handleSeatSelect}
                  />
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Click on seats to manually select them, or use the controls to automatically find seats for groups.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 mt-6">
              <h3 className="font-semibold mb-2">Seating Algorithm Rules</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                <li>Groups of 2-7 people will be seated together</li>
                <li>No single person can be left between groups (unless in VIP)</li>
                <li>VIP and accessibility zones have special seating</li>
                <li>Age-restricted zones do not allow children</li>
                <li>Elderly-friendly zones prioritized for elderly patrons</li>
                <li>Rescheduled bookings attempt to find comparable seats</li>
                <li>Admin override can bypass all seating rules</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
