const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const express = require('express');
const router = express.Router();

router.post('/', async function (request, response) {
  const { username, password } = request.body
  const hashedPass = await bcrypt.hash(password, 10);

  const existingUserName = await checkForExistingUser(username);
  if (existingUserName === username) {
    response.status(200).send("User Already exists");
    return;
  }
  pool.query('INSERT INTO account (username, password, is_admin) VALUES ($1, $2, $3) returning *', [username, hashedPass, false], (error, results) => {
    if (error) {
      throw error
    }
    const user = {
      account_id: results.rows[0].account_id,
      username: results.rows[0].username,
      is_admin: results.rows[0].is_admin
    }
    const token = jwt.sign(
      user,
      config.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    // save user token
    user.token = token;

    // return new user
    response.status(200).json(user);
    // response.status(200).send(`User Account Created: ${results.rows[0].account_id}`);
  });
});

router.post('/login', async function (request, response) {
  const { username, password } = request.body

  pool.query('SELECT * FROM account where username = ($1)', [username], async (error, results) => {
    if (error) {
      throw error
    }
    if (await bcrypt.compare(password, results.rows[0].password)) {
      const user = {
        account_id: results.rows[0].account_id,
        username: results.rows[0].username,
        is_admin: results.rows[0].is_admin
      }
      const token = jwt.sign(
        user,
        config.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      // save user token
      user.token = token;

      // return new user
      response.status(200).json(user);
    } else {
      response.status(200).send(`Login Failed`);
    }
  });
});

function checkForExistingUser(username) {
  return new Promise(async resolve => {
    pool.query('SELECT username FROM account where username = ($1)', [username], (error, results) => {
      if (error) {
        throw error
      }
      console.log(results);
      console.log(results.rows);
      if (results) {
        resolve(results.rows[0].username);
      }
      resolve('');
    });
  });

}

module.exports = router;