# Collaborative Form - Request Approval

A Next.js application with real-time collaborative form filling using MongoDB and Mongoose.

## Features

- Multiple users can fill different fields simultaneously
- Real-time updates - see when other users fill fields
- Each field shows who updated it
- Form validation - all fields must be filled before submission
- Auto-reset after successful submission for new entry

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB:
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas and update the connection string

3. Create `.env.local` file:
```bash
MONGODB_URI=mongodb://localhost:27017/collaborative-form
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

- Each user gets a unique ID stored in localStorage
- Users can fill any field, and updates are saved immediately
- The form polls the database every 2 seconds to show updates from other users
- When all fields are filled, the Submit button becomes enabled
- After submission, the form clears automatically for a new entry

## Project Structure

```
├── app/
│   ├── api/
│   │   └── form/
│   │       └── route.js      # API endpoints for form operations
│   ├── layout.js             # Root layout
│   ├── page.js               # Main form page
│   └── globals.css           # Global styles
├── lib/
│   ├── mongodb.js            # MongoDB connection
│   └── db.js                 # Database operations
├── models/
│   └── FormEntry.js          # Mongoose schema
└── package.json
```

