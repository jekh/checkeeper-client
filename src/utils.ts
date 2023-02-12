import { Readable } from "stream"
import { BinaryDataInput } from "./types"

/** Converts binary data to base64. The input binary data can be base64, a Buffer, or a ReadableStream. */
export async function binaryDataToBase64(data: BinaryDataInput): Promise<string> {
  if (typeof data === "string") {
    return data
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("base64")
  }

  // @ts-expect-error Stream.toArray() is experimental and requires Node v16.15.0
  const buffersFromStream: Buffer[] = await data.toArray()

  const allStreamData = Buffer.concat(buffersFromStream)

  return allStreamData.toString("base64")
}

/** Trivial convenience function to convert base 64 strings to a buffer. */
export function base64ToBuffer(base64EncodedString: string) {
  return Buffer.from(base64EncodedString, "base64")
}

/** Trivial convenience function to convert base 64 strings to a stream. */
export function base64ToStream(base64EncodedString: string) {
  return Readable.from(base64ToBuffer(base64EncodedString))
}

/**
 * Parses the "amount" string returned by Checkeeper into a floating-point whole-dollar number.
 *
 * NOTE: Using floating point values to express dollar amounts as numbers is inaccurate and can result in very bad results, especially when adding or multiplying
 * the floating point value (e.g.: 1.1 + 0.3 = 2.4000000000000004).
 * Instead, use {@link parseCheckeeperAmountCents} to retrieve the parsed amount in whole cents, and manipulate the integer cents (rouding if needed).
 */
export function parseCheckeeperAmount(amount: string): number {
  // Remove anything that isn't a number or a decimal point (Checkeeper amount strings can contain dollar signs and commas).
  // Removing commas is safe since Checkeeper amounts are always US/CA locales (decimal point is '.', thousands separator is ',').
  return Number.parseFloat(amount.replaceAll(/[^\d.]/g, ""))
}

/** Parses the "amount" string returned by Checkeeper into an integer number of cents. */
export function parseCheckeeperAmountCents(amount: string): number {
  const amountDollars = parseCheckeeperAmount(amount)

  return Math.round(amountDollars * 100)
}
