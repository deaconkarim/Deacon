import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEventTypeColor } from '@/lib/eventUtils';

const CalendarView = ({ events, currentDate, setCurrentDate }) => {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startingDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const calendarCells = [];

  for (let i = 0; i < startingDay; i++) {
    calendarCells.push(
      <div key={`empty-start-${i}`} className="min-h-[100px] p-1 border rounded-md bg-gray-50"></div>
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = date.toDateString() === new Date().toDateString();
    
    const dayEvents = events.filter(event => {
      const eventStartDate = new Date(event.startDate);
      return (
        eventStartDate.getDate() === date.getDate() &&
        eventStartDate.getMonth() === date.getMonth() &&
        eventStartDate.getFullYear() === date.getFullYear()
      );
    });

    calendarCells.push(
      <div 
        key={day}
        className={`min-h-[100px] p-1 border rounded-md ${
          isToday ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'
        }`}
      >
        <div className={`text-right p-1 ${isToday ? 'font-bold text-primary' : ''}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map((event) => (
            <div 
              key={event.id}
              className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.type)}`}
              title={`${format(new Date(event.startDate), 'h:mm a')} - ${event.title}`}
            >
              {format(new Date(event.startDate), 'h:mm a')} - {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-center text-muted-foreground">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalCells = startingDay + daysInMonth;
  const remainingCells = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);

  for (let i = 0; i < remainingCells; i++) {
    calendarCells.push(
      <div key={`empty-end-${i}`} className="min-h-[100px] p-1 border rounded-md bg-gray-50"></div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>
            {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-medium py-2">
              {day}
            </div>
          ))}
          {calendarCells}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;