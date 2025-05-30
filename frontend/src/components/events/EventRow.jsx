import React from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEventTypeColor, getEventTypeLabel } from '@/lib/eventUtils';

const EventRow = ({ event, onEdit, onDelete }) => (
  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
    <td className="p-4 align-middle">
      <div className="font-medium">{event.title}</div>
      <div className="text-sm text-muted-foreground line-clamp-1">
        {event.description}
      </div>
    </td>
    <td className="p-4 align-middle">
      <div>{format(new Date(event.startDate), 'MMM d, yyyy')}</div>
      <div className="text-sm text-muted-foreground">
        {format(new Date(event.startDate), 'h:mm a')}
        {event.endDate && ` - ${format(new Date(event.endDate), 'h:mm a')}`}
      </div>
    </td>
    <td className="p-4 align-middle">{event.location || 'N/A'}</td>
    <td className="p-4 align-middle">
        {event.isExternal ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                <ExternalLink className="h-3 w-3 mr-1" /> External
            </span>
        ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Internal
            </span>
        )}
    </td>
    <td className="p-4 align-middle">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.type)}`}>
        {getEventTypeLabel(event.type)}
      </span>
    </td>
    <td className="p-4 align-middle text-right">
      {event.isExternal && event.link ? (
        <Button variant="outline" size="sm" asChild>
          <a href={event.link} target="_blank" rel="noopener noreferrer">
            View <ExternalLink className="ml-2 h-3 w-3" />
          </a>
        </Button>
      ) : (
        <div className="flex justify-end space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(event)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(event)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </td>
  </tr>
);

export default EventRow;