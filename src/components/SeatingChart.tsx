
import React from 'react';
import Seat from './Seat';
import { SeatingChart as SeatingChartType, Seat as SeatType } from '../types/venue';

interface SeatingChartProps {
  chart: SeatingChartType;
  onSeatSelect: (seat: SeatType) => void;
}

const SeatingChart: React.FC<SeatingChartProps> = ({ chart, onSeatSelect }) => {
  const renderSeats = () => {
    const rows = [];
    
    for (let i = 0; i < chart.rows; i++) {
      const rowSeats = chart.seats.filter(seat => seat.row === i);
      
      rows.push(
        <div key={`row-${i}`} className="flex justify-center">
          <div className="w-8 flex items-center justify-center font-medium">
            {i + 1}
          </div>
          <div className="flex flex-wrap">
            {rowSeats.map(seat => (
              <Seat key={seat.id} seat={seat} onSelect={onSeatSelect} />
            ))}
          </div>
        </div>
      );
    }
    
    return rows;
  };
  
  // Render column letters
  const renderColumnHeaders = () => {
    const headers = [];
    headers.push(<div key="empty" className="w-8"></div>);
    
    for (let i = 0; i < chart.columns; i++) {
      headers.push(
        <div key={`col-${i}`} className="w-10 text-center m-1 font-medium">
          {String.fromCharCode(65 + i)}
        </div>
      );
    }
    
    return <div className="flex justify-center">{headers}</div>;
  };
  
  // Render screen
  const renderScreen = () => {
    return (
      <div className="mb-8 text-center">
        <div className="mx-auto h-8 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-md w-4/5 flex items-center justify-center shadow-md">
          <span className="text-xs font-medium text-gray-800">SCREEN</span>
        </div>
        <div className="w-full h-4 bg-gradient-to-b from-gray-400 to-transparent"></div>
      </div>
    );
  };
  
  return (
    <div className="seating-chart border border-gray-200 rounded-lg p-4 pb-6 bg-white">
      {renderScreen()}
      {renderColumnHeaders()}
      {renderSeats()}
      
      <div className="mt-8 flex items-center flex-wrap justify-center gap-2 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-available rounded mr-1"></div>
          <span>Regular</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-vip rounded mr-1"></div>
          <span>VIP</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-accessibility rounded mr-1"></div>
          <span>Accessibility</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-age-restricted rounded mr-1"></div>
          <span>Age Restricted</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-elderly-friendly rounded mr-1"></div>
          <span>Elderly Friendly</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-600 rounded mr-1 ring-[0.5px] ring-black border-[0.2px] border-black shadow-sm"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-unavailable rounded mr-1"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-venue-reallocated rounded mr-1"></div>
          <span>Reallocated</span>
        </div>
      </div>
    </div>
  );
};

export default SeatingChart;
