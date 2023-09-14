"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const db = require("../db");
const router = new express.Router();

router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`
  );
  const companies = results.rows;
  return res.json({ companies });
});

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

router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();
  //FIXME: conditional is not being hit when request body is empty

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


module.exports = router;