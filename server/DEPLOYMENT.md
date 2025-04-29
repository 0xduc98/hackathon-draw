# Backend Server Deployment Guide

This guide covers the deployment of the backend server component of the application as a separate service from the frontend.

## Server Overview

The server is a Node.js application that:
- Handles drawing data storage
- Manages slide information
- Provides API endpoints for the frontend
- Uses SQLite for data persistence
- Integrates with AWS S3 for image storage

## Prerequisites

1. Node.js (version 18 or higher)
2. SQLite3
3. AWS S3 bucket (for image storage)
4. Vercel account (separate from frontend deployment)
5. Frontend application deployed and accessible (see [Frontend Deployment Guide](../DEPLOYMENT.md))

## Environment Setup

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DATABASE_URL=./database.sqlite

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_bucket_name

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## Local Development

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The server will be available at `http://localhost:3000`

## Database Setup

1. The SQLite database will be automatically created when the server starts
2. Initial schema is defined in the server code
3. Make sure the server has write permissions in the directory

## AWS S3 Setup

1. Create an S3 bucket:
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. Configure CORS for the bucket:
   ```json
   {
     "CORSRules": [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["https://your-frontend-domain.vercel.app"],
         "ExposeHeaders": []
       }
     ]
   }
   ```

3. Create an IAM user with S3 access:
   - Create a new IAM user
   - Attach the `AmazonS3FullAccess` policy
   - Save the access key and secret

## Deployment to Vercel (Separate from Frontend)

### 1. Prepare for Deployment

1. Ensure all dependencies are in `package.json`
2. Verify the `vercel.json` configuration
3. Test the build locally:
   ```bash
   vercel build
   ```

### 2. Deploy Using Vercel CLI

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Set up and deploy: `Y`
   - Link to existing project: `N`
   - Project name: `draw-server`
   - Directory: `./`
   - Override settings: `N`

### 3. Configure Environment Variables

1. Go to Vercel Dashboard
2. Select your server project
3. Go to Settings → Environment Variables
4. Add all variables from `.env`

### 4. Database Considerations

1. SQLite in Production:
   - Vercel's serverless functions are stateless
   - Consider using a managed database service
   - Options:
     - PostgreSQL on Vercel
     - MongoDB Atlas
     - AWS RDS

2. Migration Strategy:
   ```bash
   # Export current data
   sqlite3 database.sqlite .dump > backup.sql

   # Import to new database
   sqlite3 new_database.sqlite < backup.sql
   ```

### 5. API Endpoints

The server provides these main endpoints:

1. Slide Management:
   ```
   POST /api/slides - Create/update slide
   GET /api/slides/:slideId - Get slide data
   POST /api/slides/:slideId/settings - Update slide settings
   ```

2. Drawing Management:
   ```
   POST /api/drawings - Save drawing
   GET /api/drawings/:slideId - Get drawings for slide
   ```

3. Image Management:
   ```
   POST /api/images - Upload image
   GET /api/images/:imageId - Get image
   ```

### 6. Connecting Frontend to Backend

1. Update frontend environment variables:
   - Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
   - Example: `https://draw-server.vercel.app`

2. Configure CORS on the backend:
   - Allow requests from your frontend domain
   - Update CORS settings in the server code

3. Test the connection:
   - Verify API calls from frontend to backend
   - Check for CORS errors in browser console

### 7. Monitoring and Maintenance

1. Log Monitoring:
   - Use Vercel's built-in logging
   - Set up error tracking
   - Monitor API response times

2. Database Maintenance:
   - Regular backups
   - Clean up old data
   - Optimize queries

3. Performance Optimization:
   - Enable caching where appropriate
   - Optimize image sizes
   - Use connection pooling

### 8. Security Considerations

1. API Security:
   - Rate limiting
   - Input validation
   - CORS configuration
   - API key authentication

2. Data Security:
   - Encrypt sensitive data
   - Secure file uploads
   - Regular security audits

3. AWS Security:
   - Use IAM roles
   - Rotate access keys
   - Monitor S3 access

### 9. Troubleshooting

Common issues and solutions:

1. Database Issues:
   - Check file permissions
   - Verify database path
   - Ensure proper SQLite version

2. AWS S3 Issues:
   - Verify credentials
   - Check bucket permissions
   - Validate CORS settings

3. API Issues:
   - Check CORS configuration
   - Verify endpoint URLs
   - Monitor error logs

4. Frontend Connection Issues:
   - Verify API URL in frontend
   - Check CORS settings
   - Ensure network connectivity

### 10. Scaling Considerations

1. Database Scaling:
   - Consider migration to PostgreSQL
   - Implement connection pooling
   - Use read replicas

2. File Storage:
   - Implement CDN
   - Use image optimization
   - Consider caching

3. API Scaling:
   - Implement rate limiting
   - Use caching headers
   - Optimize response sizes

## Support

For additional support:
- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

## Frontend Deployment

For deploying the frontend application, please refer to the [Frontend Deployment Guide](../DEPLOYMENT.md). 