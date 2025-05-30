import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getEventTypeLabel, getEventTypeColor } from '@/lib/eventUtils';

const EventTable = ({ events }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead key="event">Event</TableHead>
            <TableHead key="datetime">Date & Time</TableHead>
            <TableHead key="location">Location</TableHead>
            <TableHead key="organizer">Organizer</TableHead>
            <TableHead key="type">Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium" key="title">{event.title}</div>
                  {event.description && (
                    <div key="description" className="text-sm text-muted-foreground line-clamp-1">
                      {event.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div key="date">{format(new Date(event.startDate), 'MMM d, yyyy')}</div>
                  <div key="time" className="text-muted-foreground">
                    {format(new Date(event.startDate), 'h:mm a')}
                    {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
                  </div>
                </div>
              </TableCell>
              <TableCell key="location-cell">{event.location || '-'}</TableCell>
              <TableCell key="organizer-cell">{event.organizer || '-'}</TableCell>
              <TableCell>
                <span key="type-badge" className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                  {getEventTypeLabel(event.type)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default EventTable;