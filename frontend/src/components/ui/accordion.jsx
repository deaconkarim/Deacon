import React, { useState, createContext, useContext, useCallback, createContext as createReactContext } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const AccordionContext = createContext();
const AccordionItemContext = createReactContext();

export function Accordion({ children, className, type = "single", collapsible = false, ...props }) {
  const [openItems, setOpenItems] = useState(new Set());

  const toggleItem = useCallback((value) => {
    setOpenItems(prevOpenItems => {
      const newOpenItems = new Set(prevOpenItems);
      
      if (type === "single") {
        if (newOpenItems.has(value)) {
          // If the item is already open, close it if collapsible is true
          if (collapsible) {
            return new Set();
          } else {
            return newOpenItems;
          }
        } else {
          // If the item is not open, open it (and close any other open item)
          return new Set([value]);
        }
      } else {
        // Multiple accordion behavior
        if (newOpenItems.has(value)) {
          newOpenItems.delete(value);
        } else {
          newOpenItems.add(value);
        }
        return newOpenItems;
      }
    });
  }, [type, collapsible]);

  const isItemOpen = useCallback((value) => {
    return openItems.has(value);
  }, [openItems]);

  const contextValue = React.useMemo(() => ({
    toggleItem,
    isItemOpen
  }), [toggleItem, isItemOpen]);

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ children, className, value, ...props }) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn("border border-slate-200 dark:border-slate-700 rounded-lg", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ children, className, ...props }) {
  const { toggleItem, isItemOpen } = useContext(AccordionContext);
  const value = useContext(AccordionItemContext);
  
  const handleClick = useCallback(() => {
    toggleItem(value);
  }, [toggleItem, value]);
  
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between p-4 text-left font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span>{children}</span>
      {isItemOpen(value) ? (
        <ChevronDown className="h-4 w-4 transition-transform" />
      ) : (
        <ChevronRight className="h-4 w-4 transition-transform" />
      )}
    </button>
  );
}

export function AccordionContent({ children, className, ...props }) {
  const { isItemOpen } = useContext(AccordionContext);
  const value = useContext(AccordionItemContext);
  const isOpen = isItemOpen(value);
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div
      className={cn("p-4 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
} 