import type { H3Event } from 'h3'
import mongoose from 'mongoose'

/** Reads a route param that must be a Mongo ObjectId; throws 400 otherwise (avoids CastError 500s). */
export function requireObjectIdParam(event: H3Event, name: string, label: string): string {
  const value = getRouterParam(event, name)
  if (!value || !mongoose.isValidObjectId(value)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid ${label} ID` })
  }
  return value
}
