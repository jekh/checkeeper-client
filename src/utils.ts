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
