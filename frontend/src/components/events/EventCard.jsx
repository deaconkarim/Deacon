import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Users, ExternalLink, UserCheck, Handshake } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEventTypeLabel, getEventTypeColor } from '@/lib/eventUtils';

const EventCard = ({ event, onManageVolunteers }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              {event.title}
              {event.needs_volunteers && (
                <span className="ml-2 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold flex items-center gap-1">
                  <Handshake className="h-4 w-4 inline-block mr-1" /> Volunteers Needed
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
            {getEventTypeLabel(event.type)}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}
              {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
            </span>
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          )}
          
          {event.organizer && (
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Organized by {event.organizer}</span>
            </div>
          )}

          <div className="flex items-center text-sm">
            <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{event.attending_count || 0} people attending</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onManageVolunteers(event)}>
            Manage Volunteers
          </Button>
        </div>
      </CardContent>
      
      {event.isExternal && event.url && (
        <CardFooter className="bg-muted/50 px-6 py-3">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              View Event Details <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default EventCard;