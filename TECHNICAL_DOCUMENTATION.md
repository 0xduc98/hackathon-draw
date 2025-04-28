# Hackathon Draw - Technical Documentation

This document provides detailed technical information about the Hackathon Draw application, including architecture, data flow, and implementation specifics.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend       │◄────┤  Backend        │◄────┤  Database       │
│  (Next.js)      │     │  (Express.js)   │     │  (SQLite)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Component Interaction

1. **Frontend-Backend Communication**:
   - RESTful API calls from frontend to backend
   - JSON data exchange
   - CORS enabled for cross-origin requests

2. **Backend-Database Interaction**:
   - SQLite database operations
   - Connection pooling
   - Transaction management

## Data Flow

### Slide Creation Flow

1. Presenter creates a new slide via the UI
2. Frontend sends POST request to `/api/slides` with slide data
3. Backend validates data and stores in `slides` table
4. Response sent back to frontend with slide ID
5. Frontend updates UI to show new slide

### Drawing Submission Flow

1. Audience member draws on canvas
2. Frontend captures drawing data
3. Frontend sends POST request to `/api/drawings` with drawing data
4. Backend validates data and stores in `drawings` table
5. Response sent back to frontend
6. Frontend updates UI to show submission status

### Reference Image Flow

1. Presenter uploads reference image
2. Frontend converts image to base64
3. Frontend sends POST request to `/api/slides/:slideId/image`
4. Backend validates data and stores in `reference_images` table
5. Response sent back to frontend
6. Frontend updates UI to show reference image

## Database Schema

### Tables

#### `slides` Table
```sql
CREATE TABLE slides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id TEXT NOT NULL UNIQUE,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### `drawings` Table
```sql
CREATE TABLE drawings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id TEXT NOT NULL,
  audience_id TEXT NOT NULL,
  audience_name TEXT NOT NULL,
  image_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slide_id) REFERENCES slides(slide_id)
)
```

#### `reference_images` Table
```sql
CREATE TABLE reference_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id TEXT NOT NULL UNIQUE,
  image_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slide_id) REFERENCES slides(slide_id)
)
```

## API Endpoints

### Slides API

#### `GET /api/slides/:slideId`
- **Purpose**: Retrieve a slide with its reference image
- **Parameters**: `slideId` (path parameter)
- **Response**: JSON object with slide data and reference image
- **Error Handling**: 404 if slide not found, 500 for server errors

#### `POST /api/slides`
- **Purpose**: Create or update a slide
- **Request Body**: `{ slideId, title }`
- **Response**: JSON object with created/updated slide data
- **Error Handling**: 400 for invalid data, 500 for server errors

#### `POST /api/slides/:slideId/image`
- **Purpose**: Save a reference image for a slide
- **Parameters**: `slideId` (path parameter)
- **Request Body**: `{ imageData }` (base64 encoded image)
- **Response**: JSON object with image ID
- **Error Handling**: 400 for invalid data, 404 if slide not found, 500 for server errors

### Drawings API

#### `GET /api/drawings/:slideId`
- **Purpose**: Get all drawings for a slide
- **Parameters**: `slideId` (path parameter)
- **Response**: JSON array of drawing objects
- **Error Handling**: 500 for server errors

#### `POST /api/drawings`
- **Purpose**: Save a drawing submission
- **Request Body**: `{ slideId, audienceId, audienceName, imageData }`
- **Response**: JSON object with drawing ID
- **Error Handling**: 400 for invalid data, 500 for server errors

## Frontend Architecture

### Component Structure

- **Page Components**: Next.js app router pages
- **UI Components**: Reusable UI elements
- **Feature Components**: Components for specific features
- **Layout Components**: Layout structure components

### State Management

- **Zustand Store**: Global application state
- **React Query**: Server state management
- **Local State**: Component-level state with useState

### Drawing Implementation

- **Fabric.js**: Canvas manipulation library
- **Drawing Tools**: Custom implementation of drawing tools
- **History Management**: Undo/redo functionality
- **Image Processing**: Base64 encoding/decoding

## Backend Architecture

### Server Setup

- **Express.js**: Web server framework
- **Middleware**: CORS, JSON parsing, error handling
- **Route Handlers**: API endpoint implementations
- **Database Connection**: SQLite connection management

### Database Operations

- **Connection Pooling**: Efficient database connections
- **Transaction Management**: Data integrity
- **Error Handling**: Graceful error recovery
- **Data Validation**: Input validation

## Security Considerations

- **Input Validation**: All user inputs are validated
- **CORS Configuration**: Restricted to allowed origins
- **Error Handling**: Detailed error messages for debugging
- **Data Sanitization**: Prevention of SQL injection

## Performance Optimization

- **Image Compression**: Base64 encoding with compression
- **Database Indexing**: Optimized queries
- **Caching**: Client-side caching with React Query
- **Lazy Loading**: Component and image lazy loading

## Deployment

### Frontend Deployment

- **Build Process**: `next build`
- **Static Generation**: Optimized for static hosting
- **Environment Variables**: Configuration management

### Backend Deployment

- **Server Process**: Node.js process management
- **Database Migration**: Schema versioning
- **Environment Configuration**: Environment-specific settings

## Testing Strategy

- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: User flow testing
- **Performance Tests**: Load and response time testing

## Future Enhancements

- **Real-time Updates**: WebSocket integration
- **User Authentication**: User management system
- **Advanced Drawing Tools**: More drawing capabilities
- **Analytics**: Usage and performance metrics
- **Mobile Optimization**: Responsive design improvements 