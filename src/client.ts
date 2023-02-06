import { getCheckeeperRequestSignature } from "./signature"
import {
  CancelCheckResponse,
  CheckeeperBoolean,
  CheckeeperErrorResponse,
  CheckIDRequest,
  CreateCheckOptions,
  CreateCheckPDFResponse,
  CreateCheckRequest,
  CreateCheckResponse,
  EasternTimeTimestamp,
  GetCheckImageResponse,
  GetCheckStatusResponse,
  ISO8601Instant,
  ListChecksRequest,
  ListChecksResponse,
  MailCheckOptions,
  MailCheckResponse,
  NameAddress,
} from "./types"
import { binaryDataToBase64 } from "./utils"

export interface Configuration {
  token: string
  secret: string
  /** Checkeeper URL. Defaults to https://my.checkeeper.com/api/v2 */
  baseUrl?: string
  /** The fetch library to use. Defaults to node 18's built-in fetch. */
  fetch?: typeof fetch
  /** When true, all requests are sent as test reqests (regardless of whether the "test" parameter is specified in a request). */
  testMode?: boolean
}

export class CheckeeperClient {
  #token: string
  #secret: string
  #baseUrl: string
  #fetch: typeof fetch

  #testMode: boolean

  constructor(config: Configuration) {
    this.#token = config.token
    this.#secret = config.secret
    this.#baseUrl = config.baseUrl || "https://my.checkeeper.com/api/v2"
    this.#fetch = config.fetch || globalThis.fetch
    this.#testMode = Boolean(config.testMode)

    if (!this.#fetch) {
      throw new Error(
        "No fetch implementation available on globalThis. Specify a fetch implementation in config options."
      )
    }
  }

  /** Lists all checks between the specified timestamps. Checkeeper appears to return both test and production checks. */
  async listChecks({ from, to }: { from: Date | ISO8601Instant; to: Date | ISO8601Instant }) {
    const fromET = toEasternTime(from)
    const toET = toEasternTime(to)
    const request: ListChecksRequest = {
      start_date: fromET,
      end_date: toET,
    }

    const resp: ListChecksResponse | CheckeeperErrorResponse = await this.#makeCheckeeperRequest(
      "/check/list",
      request
    )

    return resp
  }

  /** Returns an image of a check. The image appears to be in JPG format (even if it was originally created and returned as a PDF). */
  async getCheckImage(checkId: string) {
    const request: CheckIDRequest = {
      check_id: checkId,
    }

    const resp: GetCheckImageResponse | CheckeeperErrorResponse = await this.#makeCheckeeperRequest(
      "/check/image",
      request
    )

    return resp
  }

  async cancelCheck(checkId: string) {
    const request: CheckIDRequest = {
      check_id: checkId,
    }

    const resp: CancelCheckResponse | CheckeeperErrorResponse = await this.#makeCheckeeperRequest(
      "/check/cancel",
      request
    )

    return resp
  }

  async getCheckStatus(checkId: string) {
    const request: CheckIDRequest = {
      check_id: checkId,
    }

    const json: GetCheckStatusResponse | CheckeeperErrorResponse =
      await this.#makeCheckeeperRequest("/check/status", request)

    return json
  }

  /** Creates a check to be mailed by Checkeeper */
  async mailCheck(input: MailCheckOptions) {
    const resp = await this.#createCheck(input, false)

    return resp as MailCheckResponse | CheckeeperErrorResponse
  }

  /** Creates a check PDF. Does not mail the check. */
  async createCheckPDF(input: CreateCheckOptions) {
    const resp = await this.#createCheck(input, true)

    return resp as CreateCheckPDFResponse | CheckeeperErrorResponse
  }

  /** Sends a create check request to Checkeeper. Returns a PDF if returnPdf is true, otherwise mails the check. */
  async #createCheck(input: MailCheckOptions, returnPdf: boolean) {
    const {
      attachment,
      logo,
      signerImage,
      date,
      amount,
      checkNumber,
      bankAccount,
      bankRouting,
      memo,
      note,
      signer,
      payer,
      payee,
      mailMethod,
      mailAddress,
      template,
      test,
      invoiceTable,
    } = input

    const [attachmentBase64, logoBase64, signerImageBase64] = await Promise.all([
      attachment ? binaryDataToBase64(attachment) : undefined,
      logo ? binaryDataToBase64(logo) : undefined,
      signerImage ? binaryDataToBase64(signerImage) : undefined,
    ])

    const request: CreateCheckRequest = {
      test: booleanToCheckeeperBoolean(this.#testMode || test),
      amount,
      date,
      check_number: checkNumber,
      bank_account: bankAccount,
      bank_routing: bankRouting,
      memo,
      payer: {
        ...nameAddressToPayerPayeeAddress(payer),
        logo: logoBase64,
        signer,
        signer_image: signerImageBase64,
      },
      payee: {
        ...nameAddressToPayerPayeeAddress(payee),
      },
      note,
      mail_method: mailMethod,
      // mail_address uses a different format than payer/payee addresses
      mail_address: mailAddress
        ? {
            name: mailAddress.name,
            line1: mailAddress.addressLine1,
            line2: mailAddress.addressLine2,
            city: mailAddress.city,
            state: mailAddress.state,
            zip: mailAddress.zip,
            // country does not appear to be an option
          }
        : undefined,
      return_pdf: booleanToCheckeeperBoolean(returnPdf),
      template,
      attachment: attachmentBase64,
      invoice_table: invoiceTable,
    }

    const json: CreateCheckResponse | CheckeeperErrorResponse = await this.#makeCheckeeperRequest(
      "/check/create",
      request
    )

    return json
  }

  /** Adds the token, computes and adds the signature, then sends a request to Checkeeper. Note this *mutates* the incoming request (adds token and signature).  */
  async #makeCheckeeperRequest(path: string, request: any) {
    // Add the token to the request first, since it's required to generate the signature.
    request.token = this.#token
    request.signature = getCheckeeperRequestSignature(request, this.#secret)

    const resp = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    })

    const json = await resp.json()

    return json
  }
}

function booleanToCheckeeperBoolean(bool: boolean | undefined): CheckeeperBoolean {
  return bool ? "1" : "0"
}

function nameAddressToPayerPayeeAddress(payer: NameAddress) {
  return {
    name: payer.name,
    address: {
      line1: payer.addressLine1,
      line2: payer.addressLine2,
    },
    city: payer.city,
    state: payer.state,
    zip: payer.zip,
    country: payer.country,
  }
}

/** Converts a standard Date or ISO8601 timestamp into a Checkeeper-specific timestamp in Eastern Time. */
function toEasternTime(iso8601Timestamp: Date | ISO8601Instant): EasternTimeTimestamp {
  const date = new Date(iso8601Timestamp)
  // The date portion is an ISO8601 date (YYYY-MM-DD). Fortunately, Canada's official date format is ISO8601.
  const datePortion = date.toLocaleDateString("en-CA")
  const timePortion = date.toLocaleTimeString("en-US", {
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
  })

  return `${datePortion} ${timePortion}`
}
