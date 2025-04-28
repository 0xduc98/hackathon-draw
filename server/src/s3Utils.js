import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWSREGION,
  credentials: {
    accessKeyId: process.env.AWSACCESSKEYID,
    secretAccessKey: process.env.AWSSECRETACCESSKEY,
  },
});

export const uploadImageToS3 = async (imageData, fileName) => {
  try {
    // Remove the data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const command = new PutObjectCommand({
      Bucket: process.env.S3_PUBLIC_BUCKET,
      Key: `drawings/${fileName}`,
      Body: buffer,
      ContentType: 'image/png',
    });

    const response = await s3Client.send(command);

    // Construct the public URL
    const region = process.env.AWSREGION;
    const bucket = process.env.S3_PUBLIC_BUCKET;
    const key = `drawings/${fileName}`;
    const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return imageUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}; 