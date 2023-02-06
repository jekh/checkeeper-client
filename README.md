# Checkeeper Client

A zero-dependency node client for the [Checkeeper API](https://checkeeper.com/api).

## Requirements

- Node 16.15+
- For Node <17.5, a `fetch`-compatible polyfill or implementation, such as [isomorphic-fetch](https://www.npmjs.com/package/isomorphic-fetch). Node 18+ uses [built-in fetch support](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch).

## Usage

### Create Check API

```ts
import { Configuration, CheckeeperClient } from "checkeeper-client"

const configuration: Configuration = {
  token: "your-checkeeper-token",
  secret: "your-checkeeper-secret",
  testMode: true, // Sends all requests as "test" requests
}

const client = new CheckeeperClient(configuration)

// Create a PDF of a check, but do not mail it
await client.createCheckPDF({
  /* See CreateCheckOptions */
})

// Mail a check (does not return a PDF -- use getCheckImage() to retrieve an image)
await client.mailCheck({
  /* See MailCheckOptions */
})

// See CheckeeperClient docs for available API calls.
```

### Base64 utilities

When specifying fields that require base64 binary data, such as `logo`, `signerImage`, and `attachment`, use `binaryDataToBase64` to convert a `Buffer` or `ReadableStream` to base64.

```ts
const logo = Buffer.from(/*...*/)
const signerImage = fs.createReadStream("signature.png")
const attachment = fs.createReadStream("attachment.pdf")

client.createCheckPDF({
  logo: binaryDataToBase64(logo),
  attach: binaryDataToBase64(attachment),
  signerImage: binaryDataToBase64(signerImage),
  // ...
})
```

When receiving a base64-encoded image in a Checkeeper response, use `base64ToBuffer` or `base64ToStream` to convert the image to a Buffer or ReadableStream.

```ts
const resp = await client.createCheckPDF({
  /* ... */
})

if (resp.success) {
  fs.writeFileSync("check.pdf", base64ToBuffer(resp.pdf))
  // Or
  const fileStream = fs.createWriteStream("check-image.jpg")
  base64ToStream(resp.pdf).pipe(fileStream)
}
```

### Checkeeper Signature

The Checkeeper signature generator can be used independently, in place of the `checkeeper-signature` package.

```ts
import { getCheckeeperRequestSignature } from "checkeeper-client"

const signature = getCheckeeperRequestSignature(
  {
    /* Checkeeper request parameters */
  },
  "your-checkeeper-secret"
)
```
