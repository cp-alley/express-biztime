"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");
const router = new express.Router();

//TODO: add order by for consistent order
/** Get list of all invoices like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices`
  );
  const invoices = results.rows;
  return res.json({ invoices });
});

/** Get company details like
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}} */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`, [id]
  );

  const invoices = iResults.rows[0];

  if (!invoices) throw new NotFoundError("Invoice is not found.");

  const cResults = await db.query(
    `SELECT code, name, description
      FROM companies
      JOIN invoices ON companies.code = invoices.comp_code
      WHERE invoices.id = $1`, [id]
  );

  const companies = cResults.rows;

  invoices.company = companies;

  return res.json({ invoices });
});

/** Add new company. Needs JSON like {code, name, description}
 *
 * Return JSON like {company: {code, name, description}}
*/
router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;
  const results = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`,
    [code, name, description]
  );
  const company = results.rows[0];
  return res.status(201).json({ company });
});

/** Edit existing company. Needs JSON like {name, description}
 *
 * Return JSON like {company: {code, name, description}}
*/
router.put("/:code", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const code = req.params.code;
  const { name, description } = req.body;

  const results = await db.query(
    `UPDATE companies
      SET name=$1,
          description=$2
      WHERE code = $3
      RETURNING code, name, description`,
    [name, description, code]
  );

  const company = results.rows[0];

  if (!company) throw new NotFoundError("Company is not found.");
  return res.json({ company });
});

/** Delete company. Returns {status: "deleted"} on success */
router.delete("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `DELETE FROM companies
    WHERE code = $1
    RETURNING code`, [code]
  );
  const company = results.rows[0];

  if (!company) throw new NotFoundError("Company is not found.");
  return res.json({ status: "deleted" });
});


module.exports = router;