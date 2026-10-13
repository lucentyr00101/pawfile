import type { H3Event } from 'h3'

// Headroom for multipart boundaries and part headers on top of the file itself
const MULTIPART_OVERHEAD = 64 * 1024

/**
 * Rejects oversized uploads from the Content-Length header before the body is buffered
 * into memory by readMultipartFormData(). The per-file size check still runs afterwards.
 */
export function assertUploadSize(event: H3Event, maxFileBytes: number, label = 'file') {
  const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (contentLength > maxFileBytes + MULTIPART_OVERHEAD) {
    throw createError({
      statusCode: 413,
      statusMessage: `${label} must be ${Math.round(maxFileBytes / 1024 / 1024)}MB or smaller`,
    })
  }
}
