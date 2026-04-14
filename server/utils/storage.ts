import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client

  const endpoint = process.env.STORAGE_ENDPOINT
  const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY
  const region = process.env.STORAGE_REGION || 'auto'

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing storage environment variables: STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY')
  }

  client = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  return client
}

function getBucket(): string {
  const bucket = process.env.STORAGE_BUCKET
  if (!bucket) throw new Error('Missing storage environment variable: STORAGE_BUCKET')
  return bucket
}

function getPublicUrl(): string {
  const url = process.env.STORAGE_PUBLIC_URL
  if (!url) throw new Error('Missing storage environment variable: STORAGE_PUBLIC_URL')
  return url.replace(/\/$/, '')
}

/**
 * Generates a unique storage path for a file.
 * Returns a key in the form: pets/{userId}/{uuid}.{ext}
 */
export function generateFilePath(userId: string, originalFilename: string): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'bin'
  const uuid = crypto.randomUUID()
  return `pets/${userId}/${uuid}.${ext}`
}

/**
 * Uploads a file to the storage provider and returns the public URL.
 * @param file - File contents as a Buffer
 * @param filename - Storage key (e.g. pets/{userId}/{uuid}.jpg) — build with generateFilePath()
 * @param contentType - MIME type (e.g. image/jpeg)
 */
export async function uploadFile(file: Buffer, filename: string, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: filename,
      Body: file,
      ContentType: contentType,
    }),
  )

  return `${getPublicUrl()}/${filename}`
}

/**
 * Deletes a file from the storage provider.
 * @param fileUrl - Either the full public URL or the bare storage key
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const publicUrl = getPublicUrl()
  const key = fileUrl.startsWith(publicUrl) ? fileUrl.slice(publicUrl.length + 1) : fileUrl

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  )
}
