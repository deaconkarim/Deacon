import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon } from 'lucide-react';
import EventCard from '@/components/events/EventCard';

const EventList = ({ events, isLoading, containerVariants, searchQuery, typeFilter }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-medium">Loading Events...</h3>
        <p className="text-muted-foreground mt-1">Please wait while we fetch the latest events from the church website.</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No upcoming events found</h3>
        <p className="text-muted-foreground mt-1">
          {searchQuery || typeFilter !== 'all'
            ? "Try adjusting your search or filter criteria."
            : "Check back later or try refreshing the events list."}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </motion.div>
  );
};

export default EventList;