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

/** GET /companies/:code - return data about one company:
 * {code, name, description, invoices: [id,...]} */

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({
      company: {
        code: testCompany.code,
        name: testCompany.name,
        description: testCompany.description,
        invoices: []
      }
    });
  });

  test("404 if company not found", async function () {
    const resp = await request(app).get(`/companies/99`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** POST /companies - create company from data;
 * return `{company: {code, name, description}}` */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        code: "test2",
        name: "test2name",
        description: "another amazing company"
      });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: {
        code: "test2",
        name: "test2name",
        description: "another amazing company"
      }
    });
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .post("/companies")
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** PUT /companies/:code - updates company;
 * returns `{company: {code, name, description}}`
 */

describe("PUT /companies/:code", function () {
  test("Update single company", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({
        name: "Yes",
        description: "Yes"
      });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: {
        code: testCompany.code,
        name: "Yes",
        description: "Yes"
      }
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app)
      .put(`/companies/99`)
      .send({
        name: "Yes",
        description: "Yes"
      });
    expect(resp.statusCode).toEqual(404);
  });

  test("400 if empty body request", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** DELETE /companies/:code - delete company
 * return {status: "deleted"}
 */
describe("DELETE /companies/:code", function () {
  test("Delete single company", async function () {
    const resp = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });
});