import crypto from "node:crypto"
import { Base64String } from "././types"

/** Returns the signature for a Checkeeper request. The request must contain the token, but must not contain a "signature" property.  */
export function getCheckeeperRequestSignature(req: any, secretKey: string): string {
  const stringToSign = createSignableString(req)

  return signString(stringToSign, secretKey)
}

/** Calculates the raw string that will be signed according to Checkeeper's unique algorithm. */
export function createSignableString(req: any): string {
  const nestedKeyValuePairs = Object.entries(req).map((entry) =>
    createNestedKeyValuePairs(entry, undefined)
  )
  const flatKeyValuePairs = nestedKeyValuePairs.flat(10).filter(Boolean) as KeyValuePair[]

  const params = new URLSearchParams()
  flatKeyValuePairs.forEach(({ key, value }) => params.append(key, value))

  // The parameters must be sorted lexicographically
  params.sort()

  return params.toString()
}

/** Signs the string using the signingKey and returns the result as a base64 string. */
export function signString(str: string, secretKey: string): Base64String {
  return crypto.createHmac("sha256", secretKey).update(str).digest("base64")
}

type Entry = [string, unknown]

interface KeyValuePair {
  key: string
  value: string
}

/** A KeyValuePair or an array containing KeyValuePairs and nested arrays of KeyValuePairs. This represents an unflattened array of KeyValuePair.*/
type NestedKeyValuePairs = KeyValuePair | NestedKeyValuePairs[] | undefined

function createNestedKeyValuePairs(
  [key, value]: Entry,
  parentKey: string | undefined
): NestedKeyValuePairs {
  // The name of this key If this is a top-level element (i.e. there is no existing prefix), this is simply the
  // name of the key. If this is not a top-level element, append "[<key>]" to the parent key.
  // For example, if a CreateCheckRequest has properties { payer: { address: { line1: "Some Value" } } },
  // the key (for Checkeeper signature purposes) would be "payer[address][line1]".
  // Arrays are treated similarly, but with the element index as the key, for example: "invoice_table[rows][0][1]"
  const keyName = parentKey ? `${parentKey}[${key}]` : key

  switch (typeof value) {
    case "object":
      if (value === null) {
        return undefined
      }

      // This works for both "regular" objects and arrays, since Object.entries on an array will create key/value pairs like ["0", "value"], ["1", "value"], etc.
      return Object.entries(value).map((entry) => createNestedKeyValuePairs(entry, keyName))

    case "string":
    case "number":
      return {
        key: keyName,
        value: value.toString(),
      }

    default:
      // No other types are supported. Even boolean does not appear to be supported (Checkeeper appears to use strings "1" and "0" instead).
      return undefined
  }
}
