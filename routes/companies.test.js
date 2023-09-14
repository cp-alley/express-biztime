"use strict";

const db = require("../db");
const app = require("../app");
const request = require("supertest");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('testCode', 'testCompany', 'an amazing company')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});


/** GET /companies - returns {companies: [{code, name}, ...]} */

describe("GET /companies", function () {
  test("Gets companies", async function () {
    const resp = await request(app).get('/companies');
    expect(resp.body).toEqual({
      companies: [{ code: testCompany.code, name: testCompany.name }],
    });
  });
});
