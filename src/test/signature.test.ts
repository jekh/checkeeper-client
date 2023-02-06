// @ts-expect-error No checkeeper-signature types
import sign from "checkeeper-signature"

import { assert } from "chai"
import { getCheckeeperRequestSignature } from "../signature"
import { CreateCheckRequest } from "../types"

const testKey = "secret"

const createCheckRequest: CreateCheckRequest & { token: string } = {
  token: "anytoken",
  test: "1",
  date: "2020-06-14",
  check_number: "50006",
  amount: "299235",
  memo: "This is a lengthy memo field with many characters. 73 characters in fact.",
  bank_routing: "012345678",
  bank_account: "9320122",
  payer: {
    name: "Widgets Inc.",
    address: {
      line2: "Suite 102",
      line1: "827 Random Street",
    },
    city: "Anytown",
    state: "NY",
    zip: "14850",
    signer: "Knollback Reynyrard",
  },
  payee: {
    name: "Bob Smith",
    address: {
      line1: "114 Project Lane",
    },
    city: "Tinkertown",
    state: "CA",
    zip: "90210",
    country: "US",
  },
  return_pdf: "1",
  template: "default-fulfillment",
  mail_method: "first_class",
  mail_address: {
    name: "Karen in Accounting",
    line1: "101 North Main Street",
    line2: null,
    city: "Charleston",
    state: "SC",
    zip: "29601",
  },
  invoice_table: {
    headings: ["Invoice", "Date", "Amount"],
    rows: [
      ["30093", "2020-06-14", "$75.00"],
      ["30096", "2020-05-14", "$75.00"],
      [" ", " ", "$150.00"],
    ],
  },
} as const

describe("Checkeeper Signature", function () {
  it("should generate the same signature as checkeeper-signature", function () {
    const newSignature = getCheckeeperRequestSignature(createCheckRequest, testKey)

    const oldSignature = sign(createCheckRequest, {
      token: createCheckRequest.token,
      secretKey: testKey,
    })

    assert.strictEqual(newSignature, oldSignature)
  })
})
