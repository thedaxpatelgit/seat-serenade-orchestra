
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { User, Users, Accessibility } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeatingControlsProps {
  onFindSeats: (
    groupSize: number, 
    requiresVIP: boolean, 
    requiresAccessibility: boolean,
    hasChildren: boolean,
    hasElderly: boolean,
    adminOverride: boolean
  ) => void;
  onClearSelection: () => void;
  onConfirmBooking: (hasChildren: boolean, hasElderly: boolean) => void;
  selectedSeatsCount: number;
  maxGroupSize: number;
}

const SeatingControls: React.FC<SeatingControlsProps> = ({ 
  onFindSeats, 
  onClearSelection, 
  onConfirmBooking,
  selectedSeatsCount,
  maxGroupSize
}) => {
  const MIN_GROUP_SIZE = 2; // Define the minimum group size
  const [groupSize, setGroupSize] = useState<number>(MIN_GROUP_SIZE); // Default to min size
  const [requiresVIP, setRequiresVIP] = useState<boolean>(false);
  const [requiresAccessibility, setRequiresAccessibility] = useState<boolean>(false);
  const [hasChildren, setHasChildren] = useState<boolean>(false);
  const [hasElderly, setHasElderly] = useState<boolean>(false);
  const [adminOverride, setAdminOverride] = useState<boolean>(false);
  
  const handleGroupSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    // Add validation to prevent sizes below minimum
    if (newSize < MIN_GROUP_SIZE) {
      return;
    }
    setGroupSize(newSize);
  };
  
  const handleFindSeats = () => {
    // Ensure group size meets minimum before proceeding
    if (groupSize < MIN_GROUP_SIZE) {
      return;
    }
    
    onFindSeats(
      groupSize, 
      requiresVIP, 
      requiresAccessibility, 
      hasChildren,
      hasElderly,
      adminOverride
    );
  };
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Seating Options</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group-size">Group Size (min: {MIN_GROUP_SIZE})</Label>
          <Select 
            value={groupSize.toString()} 
            onValueChange={handleGroupSizeChange}
          >
            <SelectTrigger id="group-size">
              <SelectValue placeholder="Select group size" />
            </SelectTrigger>
            <SelectContent>
              {/* Generate options from MIN_GROUP_SIZE to maxGroupSize */}
              {[...Array(maxGroupSize - MIN_GROUP_SIZE + 1)].map((_, i) => (
                <SelectItem key={i + MIN_GROUP_SIZE} value={(i + MIN_GROUP_SIZE).toString()}>
                  {i + MIN_GROUP_SIZE} people
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="vip-option" 
            checked={requiresVIP} 
            onCheckedChange={(checked) => setRequiresVIP(!!checked)} 
          />
          <Label htmlFor="vip-option">VIP Seating</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="accessibility-option" 
            checked={requiresAccessibility} 
            onCheckedChange={(checked) => setRequiresAccessibility(!!checked)} 
          />
          <Label htmlFor="accessibility-option" className="flex items-center">
            <Accessibility size={16} className="mr-1" /> Accessibility Needed
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="has-children" 
            checked={hasChildren} 
            onCheckedChange={(checked) => setHasChildren(!!checked)} 
          />
          <Label htmlFor="has-children" className="flex items-center">
            <Users size={16} className="mr-1" /> With Children
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="has-elderly" 
            checked={hasElderly} 
            onCheckedChange={(checked) => setHasElderly(!!checked)} 
          />
          <Label htmlFor="has-elderly" className="flex items-center">
            <User size={16} className="mr-1" /> With Elderly
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="admin-override" 
            checked={adminOverride} 
            onCheckedChange={(checked) => setAdminOverride(!!checked)} 
          />
          <Label htmlFor="admin-override">Admin Override (Bypass Rules)</Label>
        </div>
        
        <div className="pt-2 space-x-2">
          <Button onClick={handleFindSeats} className="bg-blue-600 hover:bg-blue-700">
            Find Seats
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClearSelection}
          >
            Clear Selection
          </Button>
        </div>
        
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm mb-2">
            {selectedSeatsCount > 0 ? (
              <p className="font-medium text-green-600">Selected seats: {selectedSeatsCount}</p>
            ) : (
              <p>No seats selected</p>
            )}
          </div>
          
          <Button 
            onClick={() => onConfirmBooking(hasChildren, hasElderly)}
            disabled={selectedSeatsCount === 0}
            className={cn(
              "w-full transition-all duration-300",
              selectedSeatsCount >= MIN_GROUP_SIZE 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-400 hover:bg-gray-500"
            )}
          >
            Confirm Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeatingControls;
