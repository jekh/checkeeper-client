/** A string that contains binary data that is base64-encoded. */
export type Base64String = string

/** Binary input (attachments, logos, payer signature) can be specified as base64, a Buffer, or a ReadableStream. They are always converted to a base64 string when sending. */
export type BinaryDataInput = Base64String | Buffer | NodeJS.ReadableStream

export type MailMethod = "first_class" | "next_day" | "priority"

export type CheckeeperBoolean = "1" | "0"

export interface NameAddress {
  name: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zip: string
  /** Appears to default to US if not specified. Some fields (such as payer) do not allow country and will ignore this field. */
  country?: string
}

/**
 * A timestamp in Eastern Time, without a timezone indicator, and with a 24-hour hour field. The format is "YYYY-MM-DD 23:MM:SS", for example:
 * 2023-01-19 14:00:00
 * 2023-02-01 00:00:00
 */
export type EasternTimeTimestamp = string

/** A date in the format YYYY-MM-DD */
export type ISO8601Date = string

/** A timestamp in ISO8601 format. This is the same format returned from new Date().toISOString(), e.g. 2022-01-15T15:00:23.012Z. */
export type ISO8601Instant = string

/** Response returned from Checkeeper when creating a check. */
export interface CreateCheckResponse {
  success: true
  status: number
  message: string
  check: CheckeeperCheck

  /**
   * When return_pdf is true in the request, this is a base64-encoded string, otherwise it is null.
   * base64ToBuffer and base64ToStream are convenience functions to convert the base64 string into a Buffer or ReadableStream.
   */
  pdf: Base64String | null

  /**
   * The type appears to vary between test and production mode. In production, this appears to be a number, but in test mode this is a string.
   * To consume this value, first parse it with Number(), or .toString().
   */
  remaining_credits: string | number

  /**
   * Like remaining_credits, this varies between test and production modes, but it is the opposite of remaining_credits: A string in prod, number in test mode.
   * For consistency, use Number() or .toString() when consuming this value.
   */
  credit_cost: number | string
}

/** Response from Checkeeper when creating a PDF. */
export type CreateCheckPDFResponse = CreateCheckResponse & { pdf: Base64String }

/** Response from Checkeeper when creating a check for mailing (not a PDF). */
export type MailCheckResponse = CreateCheckResponse & { pdf: null }

/** Additional potential options to specify when creating a check to mail, rather than for a PDF. */
export interface MailCheckOptions extends CreateCheckOptions {
  /** Defaults to first_class. */
  mailMethod?: MailMethod
  /** Override the address the check is mailed to (will not be mailed to the payee address). */
  mailAddress?: NameAddress
  /** PDF that will be printed and attached to the outbound check. */
  attachment?: BinaryDataInput
}

/** Options to create a check, whether as a PDF or to be printed and mailed by Checkeeper. */
export interface CreateCheckOptions {
  test?: boolean

  /** This appears to be an internal note that is not printed on the check. */
  note?: string

  /** Decimal value expressed as a string. Can include a leading dollar sign and commas. Examples: "$299,957.10", "150520.22", "10". */
  amount: string
  /** ISO8601 date string: YYYY-MM-DD. If omitted, the current date (presumably ET) will be used. */
  date?: string
  checkNumber: string
  bankRouting: string
  bankAccount: string
  memo?: string

  payer: NameAddress
  /** The name of the signer, to be drawn onto the check in a handwriting font. */
  signer?: string
  /** Must be a PNG or GIF (according to the error message when another format is specified) */
  signerImage?: BinaryDataInput
  /** Must be a PNG, GIF, or JPG (according to the error message when another format is specified) */
  logo?: BinaryDataInput

  payee: NameAddress

  template?: string

  invoiceTable?: InvoiceTable
}

export interface CreateCheckRequest {
  note?: string

  /** Check date. ISO8601 date format: YYYY-MM-DD. Defaults to today's today (presumably in Eastern Time). */
  date?: ISO8601Date

  test?: CheckeeperBoolean
  /** Defaults to *not* returning a PDF */
  return_pdf?: CheckeeperBoolean
  template?: string

  /** Base64-encoded string. */
  attachment?: Base64String

  amount: string
  check_number: string
  bank_routing: string
  bank_account: string
  memo?: string

  payer: {
    name: string
    address: {
      line1: string
      /** May be an empty string if no line2 is specified. */
      line2?: string
    }
    city: string
    state: string
    zip: string
    /** Base64-encoded string, or null if no logo was specified. */
    logo?: Base64String | null
    signer?: string
    /** Base64-encoded string, or null if no signer image was specified. */
    signer_image?: Base64String | null
  }
  payee: {
    name: string
    address: {
      line1: string
      /** May be an empty string if no line2 is specified. */
      line2?: string
    }
    city: string
    state: string
    zip: string
    country?: string
  }
  mail_method?: MailMethod
  mail_address?: {
    name: string
    line1: string
    line2?: null | string
    city: string
    state: string
    zip: string
  }
  invoice_table?: InvoiceTable
}

/**
 * An invoice_table that can be specified when creating a check to be mailed. Specify a number as the type parameter to enforce the number
 * of columns, for example:
 * const invoiceTable: InvoiceTable<4> = { headings: ["Must", "Have", "4", "Headings"] }
 */
export interface InvoiceTable<Columns extends number = number> {
  headings: readonly string[] & { length: Columns }
  rows: readonly (readonly (string | number)[] & { length: Columns })[]
}

/** Check data returned when creating a new check. */
export interface CheckeeperCheck {
  id: string
  test: CheckeeperBoolean
  /** ISO8601 date: YYYY-MM-DD */
  date: ISO8601Date
  currency: string
  /** May be empty string */
  note: string
  pdf_background: boolean
  attachment: "none" | "processed"
  amount: string
  check_number: string
  bank_routing: string
  /** All but last 4 appear to be masked, e.g. "XXXXX1234". */
  bank_account: string
  memo?: string
  payer: {
    name: string
    address: {
      line1: string
      /** May be an empty string if no line2 is specified. */
      line2: string
    }
    city: string
    state: string
    zip: string
    /** Appears to be the literal string "[processed]" if a logo was specified, otherwise null. */
    logo: "[processed]" | null
    /** Null if no signer (name) was specified. */
    signer: string | null
    /** If no signer_image was specified, this is null. If one was specified, apepars to be "[processed]". */
    signer_image: "[processed]" | null
  }
  payee: {
    name: string
    address: {
      line1: string
      /** May be an empty string if no line2 is specified. */
      line2: string
    }
    city: string
    state: string
    zip: string
    country?: string
  }
  mail_method?: MailMethod
  mail_address?: {
    name: string
    line1: string
    line2?: null | string
    city: string
    state: string
    zip: string
  }
  invoice_table?: InvoiceTable
}

/** Request format for multiple APIs that require only a check_id */
export interface CheckIDRequest {
  check_id: string
}

export interface GetCheckStatusResponse {
  success: true
  message: string
  check: {
    check_id: string
    status: "pdf" | "canceled" | "pending" | "mailed" | "test"
    created: EasternTimeTimestamp
    /** If a PDF was requested instead of a mailing, null. Otherwise, the string "pending" or a date: YYYY-MM-DD. */
    printed: null | "pending" | ISO8601Date
    /** If a PDF was requested instead of a mailing, null. Otherwise, the string "pending" or a date: YYYY-MM-DD. */
    mailed: null | "pending" | ISO8601Date
    /** Not present when a PDF was requested. */
    mail_method?: MailMethod
    /** Empty string if mailed without tracking (first_class) */
    tracking_number?: string
    /** Empty string if mailed without tracking (first_class) */
    tracking_url?: string
  }
}

export interface ListChecksRequest {
  start_date: EasternTimeTimestamp
  end_date: EasternTimeTimestamp
}

export interface CheckeeperErrorResponse {
  success: false
  status: number
  message: string
}

export interface CancelCheckResponse {
  success: true
  message: string
  check_id: string
}

export interface GetCheckImageResponse {
  success: true
  check_id: string
  /** Base64-encoded. Appears to be a JPG */
  image: Base64String
}

export interface ListChecksResponse {
  success: true
  checks: ListCheckItem[]
}

export interface ListCheckItem {
  id: string
  /** ISO8601 date: YYYY-MM-DD */
  date: ISO8601Date
  check_number: string
  /** A decimal string, without the $, without commas, and with 2 decimal places, e.g. "24009.00". */
  amount: string
  memo: string
  note: string
  /** It appears this field can be an empty string. It's not entirely clear what that means. */
  test: CheckeeperBoolean | ""
  /** Appears to indicate whether a PDF was returned. This is a JSON *number*, unlike other boolean fields which are string values (this is 0 or 1 instead of "0" or "1"). */
  pdf: 1 | 0
  payer: {
    name: string
    address: {
      line1: string
      /** In practice, this appears to be present, even if line2 was not specified when creating the check. */
      line2?: string | ""
    }
    city: string
    state: string
    zip: string
    /** Signer name or empty string if there was no signer name or a signer_image was used isntead. */
    signer: string | ""
    /** The literal value "processed" if an image was used, otherwise empty string. */
    signer_image: "processed" | ""
  }
  payee: {
    name: string
    address: {
      line1: string
      /** In practice, this appears to be present, even if line2 was not specified when creating the check. */
      line2?: string | ""
    }
    city: string
    state: string
    zip: string
    country: string
  }
}
