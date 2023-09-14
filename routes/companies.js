"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");
const router = new express.Router();


/** Get list of all companies like {companies: [{code, name}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies
        ORDER BY code`
  );
  const companies = results.rows;
  return res.json({ companies });
});

/** Get company details like {company: {code, name, description}} */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`, [code]
  );

  const company = results.rows[0];

  if (company === undefined) throw new NotFoundError("Company is not found.");

  return res.json({ company });
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