# Church App

A modern web application for managing church events, member information, and attendance tracking.

## Features

### Member Management
- Member profiles with personal information
- Member status tracking (active, inactive, etc.)
- Quick member search and filtering
- Member list and grid views
- Member profile editing

### Event Management
- Create and manage church events
- Event categories (Sunday Worship, Potluck, etc.)
- Event attendance tracking
- Event details and descriptions
- Event date and time management

### Potluck Management
- RSVP system for potluck events
- Dish type tracking (main dish, side dish, dessert)
- Dish descriptions
- Current RSVP list view
- Member RSVP management

### Attendance Tracking
- Check-in system for events
- Attendance history
- Member attendance records
- Event attendance statistics

## Tech Stack

- **Frontend**: React.js with Next.js
- **UI Components**: Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd ChurchApp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Members Table
- id (UUID)
- firstname (text)
- lastname (text)
- email (text)
- phone (text)
- status (text)
- image_url (text)
- created_at (timestamp)
- updated_at (timestamp)

### Events Table
- id (UUID)
- title (text)
- description (text)
- event_type (text)
- start_time (timestamp)
- end_time (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

### Event Attendance Table
- id (UUID)
- event_id (UUID)
- member_id (UUID)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)

### Potluck RSVPs Table
- id (UUID)
- event_id (UUID)
- member_id (UUID)
- dish_type (text)
- dish_description (text)
- created_at (timestamp)
- updated_at (timestamp)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 