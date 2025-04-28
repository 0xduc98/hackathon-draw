# Hackathon Draw - Interactive Drawing Application

A real-time collaborative drawing application built for hackathons and presentations, allowing presenters to create slides with reference images and audience members to submit drawings.

## Solution Design

### Architecture Overview

The application follows a modern web architecture with:

1. **Frontend**: Next.js React application with TypeScript
   - Client-side drawing capabilities using Fabric.js
   - Real-time updates using React Query
   - State management with Zustand

2. **Backend**: Express.js server with SQLite database
   - RESTful API endpoints for slides and drawings
   - SQLite for persistent storage
   - CORS enabled for cross-origin requests

3. **Database Schema**:
   - `slides`: Stores slide information (id, title, etc.)
   - `drawings`: Stores audience drawing submissions
   - `reference_images`: Stores reference images for slides

### Key Features

- **Presenter Mode**: Create and manage slides with reference images
- **Audience Mode**: View slides and submit drawings
- **Real-time Drawing**: Interactive canvas with various drawing tools
- **Countdown Timer**: Time-limited drawing sessions
- **Drawing History**: View and navigate through drawing history

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hackathon-draw
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```
   The server will run on http://localhost:3001

2. Start the frontend development server:
   ```bash
   # From the root directory
   npm run dev
   # or
   pnpm dev
   ```
   The frontend will run on http://localhost:3000

## API Documentation

### Slides API

- `GET /api/slides/:slideId` - Get a slide with its reference image
- `POST /api/slides` - Create or update a slide
- `POST /api/slides/:slideId/image` - Save a reference image for a slide

### Drawings API

- `GET /api/drawings/:slideId` - Get all drawings for a slide
- `POST /api/drawings` - Save a drawing submission

## Project Structure

### Frontend

- `/src/app` - Next.js app router pages
- `/src/components` - React components
- `/src/store` - Zustand state management
- `/src/api` - API client functions
- `/src/hooks` - Custom React hooks
- `/src/utils` - Utility functions

### Backend

- `/server/src/index.js` - Express server and API routes
- `/server/src/db.js` - Database connection and schema

## Usage Guide

### For Presenters

1. Navigate to the home page
2. Create a new slide or select an existing one
3. Upload a reference image (optional)
4. Start a presentation session
5. Control the countdown timer
6. View and manage audience submissions

### For Audience Members

1. Join a presentation using the slide ID
2. View the reference image (if provided)
3. Draw on the canvas during the countdown
4. Submit your drawing
5. View other participants' submissions

## Technologies Used

- **Frontend**:
  - Next.js 14
  - React 18
  - TypeScript
  - Fabric.js
  - Ant Design
  - Zustand
  - React Query

- **Backend**:
  - Express.js
  - SQLite3
  - Node.js

## License

[MIT License](LICENSE)

## Contributors

- [Your Name/Team]
