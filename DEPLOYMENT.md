# Frontend Deployment Guide for Vercel

This guide will walk you through deploying the frontend application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Node.js](https://nodejs.org/) installed (version 18 or higher recommended)
3. [Git](https://git-scm.com/) installed
4. Your project code in a Git repository (GitHub, GitLab, or Bitbucket)
5. Backend API deployed and accessible (see [Server Deployment Guide](./server/DEPLOYMENT.md))

## Project-Specific Configuration

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app

# MQTT Configuration
NEXT_PUBLIC_MQTT_BROKER_URL=wss://broker.emqx.io:8084/mqtt

# Node Environment
NODE_ENV=production
```

### Project Structure

Ensure your project has the following structure:
```
.
├── src/
│   ├── app/
│   ├── components/
│   ├── store/
│   ├── utils/
│   └── api/
├── public/
├── package.json
├── next.config.js
├── vercel.json
└── .env
```

## Deployment Steps

### 1. Prepare Your Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project locally to test:
   ```bash
   npm run build
   ```

3. Run tests to ensure everything works:
   ```bash
   npm test
   ```

### 2. Deploy Using Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy your project:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy: `Y`
   - Link to existing project: `N`
   - Project name: `hackathon-draw-frontend`
   - Directory: `./` (root directory)
   - Override settings: `N`

### 3. Deploy Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
   - Install Command: `npm install`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add the following variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app
     NEXT_PUBLIC_MQTT_BROKER_URL=wss://broker.emqx.io:8084/mqtt
     NODE_ENV=production
     ```
   - Select "Production" environment

6. Click "Deploy"

### 4. Post-Deployment Configuration

1. Verify API Connection:
   - Test API connection in the deployed environment
   - Ensure backend API is accessible from the frontend

2. Test MQTT Connection:
   - Verify MQTT connection in the deployed environment
   - Ensure MQTT broker is accessible from Vercel's servers

3. Monitor Real-time Features:
   - Test slide synchronization
   - Verify countdown timer functionality
   - Check image upload and display

4. Configure AWS S3:
   - Verify S3 bucket is accessible
   - Test file upload functionality
   - Ensure CORS is properly configured on the S3 bucket
   - Check image loading from S3 URLs

### 5. Troubleshooting

Common issues specific to the frontend:

1. API Connection Issues:
   - Verify API URL is correct
   - Check if API server is running and accessible
   - Ensure CORS is properly configured on the backend

2. MQTT Connection Issues:
   - Verify MQTT broker URL is correct
   - Check if MQTT broker allows connections from Vercel's IP ranges
   - Ensure MQTT client is properly initialized

3. Build Issues:
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Ensure environment variables are set

4. S3 Upload Issues:
   - Verify S3 bucket name and region
   - Check if S3 bucket CORS allows uploads from your domain
   - Ensure file size is within limits
   - Verify file types are allowed
   - Check network connectivity to S3

### 6. Maintenance

Regular maintenance tasks:

1. Update dependencies:
   ```bash
   npm update
   ```

2. Monitor API connections
3. Check MQTT performance
4. Review error logs
5. Update environment variables as needed

### 7. Security Considerations

1. Keep dependencies updated
2. Use environment variables for sensitive data
3. Enable Vercel's security headers
4. Implement rate limiting for API calls
5. Use HTTPS (enabled by default on Vercel)

## Support

For additional support:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Support](https://vercel.com/support)

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Analytics](https://vercel.com/analytics)

## Backend Deployment

For deploying the backend server, please refer to the [Server Deployment Guide](./server/DEPLOYMENT.md).

### AWS S3 Configuration Guide

#### 1. S3 Bucket Setup

1. Create an S3 bucket:
   ```bash
   aws s3 mb s3://your-bucket-name --region your-aws-region
   ```

2. Configure bucket for public access (if needed):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

3. Configure CORS for the bucket:
   ```json
   {
     "CORSRules": [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": [
           "https://your-frontend-domain.vercel.app",
           "http://localhost:3000"
         ],
         "ExposeHeaders": ["ETag"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

#### 2. File Upload Implementation

1. Install AWS SDK:
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. Create S3 client configuration:
   ```typescript
   // src/utils/s3Config.ts
   import { S3Client } from '@aws-sdk/client-s3';

   export const s3Client = new S3Client({
     region: process.env.NEXT_PUBLIC_S3_REGION,
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
     },
   });
   ```

3. Implement file upload function:
   ```typescript
   // src/utils/uploadToS3.ts
   import { PutObjectCommand } from '@aws-sdk/client-s3';
   import { s3Client } from './s3Config';

   export async function uploadToS3(
     file: File,
     folder: string = 'uploads'
   ): Promise<string> {
     const fileExtension = file.name.split('.').pop();
     const fileName = `${folder}/${Date.now()}.${fileExtension}`;

     const command = new PutObjectCommand({
       Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
       Key: fileName,
       Body: file,
       ContentType: file.type,
     });

     try {
       await s3Client.send(command);
       return `${process.env.NEXT_PUBLIC_S3_URL}/${fileName}`;
     } catch (error) {
       console.error('Error uploading to S3:', error);
       throw error;
     }
   }
   ```

4. Usage in components:
   ```typescript
   // src/components/ImageUpload.tsx
   import { uploadToS3 } from '../utils/uploadToS3';

   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;

     try {
       const imageUrl = await uploadToS3(file, 'images');
       // Use the imageUrl in your application
     } catch (error) {
       console.error('Upload failed:', error);
     }
   };
   ```

#### 3. Security Best Practices

1. File Validation:
   - Implement file type checking
   - Set maximum file size limits
   - Sanitize file names
   - Use secure file extensions

2. Access Control:
   - Use pre-signed URLs for private files
   - Implement user authentication
   - Set appropriate bucket policies
   - Use IAM roles with least privilege

3. Performance Optimization:
   - Implement client-side image compression
   - Use CDN for faster delivery
   - Enable bucket versioning
   - Implement proper caching headers

#### 4. Error Handling

1. Common S3 Errors:
   - AccessDenied: Check IAM permissions
   - NoSuchBucket: Verify bucket name
   - InvalidAccessKeyId: Check credentials
   - SignatureDoesNotMatch: Verify secret key

2. Error Recovery:
   - Implement retry logic
   - Provide user feedback
   - Log errors for debugging
   - Handle network issues gracefully 