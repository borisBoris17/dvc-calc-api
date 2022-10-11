const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);
const bcrypt = require('bcrypt');

const express = require('express');
const router = express.Router();

router.post('/', async function (request, response) {
  const { username, password } = request.body
  const hashedPass = await bcrypt.hash(password, 10);

  pool.query('INSERT INTO account (username, password, is_admin) VALUES ($1, $2, $3) returning *', [username, hashedPass, false], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User Account Created: ${results.rows[0].account_id}`);
  });
});

router.post('/login', async function (request, response) {
  const { username, password } = request.body

  pool.query('SELECT * FROM account where username = ($1)', [username], async (error, results) => {
    if (error) {
      throw error
    }
    console.log(password);
    console.log(results.rows[0].password)
    if (await bcrypt.compare(password, results.rows[0].password)) {
      response.status(200).send(`Login Successful`);
    } else {
      response.status(200).send(`Login Failed`);
    }
  });
});

module.exports = router;