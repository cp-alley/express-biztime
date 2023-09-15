"use strict";

const db = require("../db");
const app = require("../app");
const request = require("supertest");

let testCompany;
let testInvoice;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let cResults = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('testCode', 'testCompany', 'an amazing company')
    RETURNING code, name, description`);
  testCompany = cResults.rows[0];
  console.log("test company=", testCompany, "testcompany.code=", testCompany.code);

  await db.query("DELETE FROM invoices");
  let iResults = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ('${testCompany.code}', 5)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = iResults.rows[0];
});

/** GET /companies - returns {invoices: [{id, comp_code}, ...]} */

describe("GET /invoices", function () {
  test("Gets invoices", async function () {
    const resp = await request(app).get('/invoices');
    expect(resp.body).toEqual({
      invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }],
    });
  });
});