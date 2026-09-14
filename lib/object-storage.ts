import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "./config";

// A shared S3-compatible client which uses MinIO in local development and can be switched to Amazon S3, Cloudflare R2, or any S3-compatible storage by updating environment variables.

const s3Client = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  forcePathStyle: config.s3ForcePathStyle,
  credentials: {
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
  },
});

/*

> A Buffer is a Node.js object that stores raw binary data in memory, allowing you to read, modify, and transfer files like images, videos, audio files, PDFs, or other byte-based data efficiently.

  - Uploads a buffer to the configured bucket (`artifact-uploads`) under the given key (path to the file in the bucket) and returns its public URL.

  - The bucket is configured for public read access, so the uploaded object can be accessed directly without generating a signed URL.

*/

export async function uploadObject(params: {
  key: string; // Path to the file in the bucket
  body: Buffer; // Raw binary data of the file
  contentType: string; // MIME type of the file
}): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return `${config.s3PublicUrl}/${params.key}`;
}
