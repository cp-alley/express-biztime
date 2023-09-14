"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");
const router = new express.Router();


/** Get list of all invoices like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY id`
  );
  const invoices = results.rows;
  return res.json({ invoices });
});

/** Get invoice details like
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}} */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const iResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
      FROM invoices
      WHERE id = $1`, [id]
  );

  const invoices = iResults.rows[0];

  if (!invoices) throw new NotFoundError("Invoice not found.");

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

/** Add new invoice. Needs JSON like {comp_code, amt}
 *
 * Return JSON like {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;
  const cResults = await db.query(
    `SELECT code FROM companies WHERE code = $1`, [comp_code]
  );

  const company = cResults.rows[0];
  if (!company) throw new NotFoundError(`${comp_code} not found`);

  const iResults = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = iResults.rows[0];
  return res.status(201).json({ invoice });
});

/** Update an invoice. Needs JSON body of {amt}
 *
 * Return JSON like {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put("/:id", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const id = req.params.id;
  const { amt } = req.body;

  const results = await db.query(
    `UPDATE invoices
      SET amt=$1
      WHERE id = $2
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError("Invoice was not found.");
  return res.json({ invoice });
});

/** Delete invoice. Returns {status: "deleted"} on success */
router.delete("/:id", async function (req, res) {
  const id = req.params.id;

  const results = await db.query(
    `DELETE FROM invoices
     WHERE id = $1
     RETURNING id`, [id]
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError("Invoice was not found.");
  return res.json({ status: "deleted" });
});


module.exports = router;