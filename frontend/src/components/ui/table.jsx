import * as React from 'react';

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table ref={ref} className={`w-full caption-bottom text-sm ${className || ''}`} {...props} />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={className} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={className} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={className} {...props} />
));
TableRow.displayName = 'TableRow';

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={className} {...props} />
));
TableCell.displayName = 'TableCell';

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={className} {...props} />
));
TableHead.displayName = 'TableHead';

export { Table, TableHeader, TableBody, TableRow, TableCell, TableHead }; 