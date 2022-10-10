const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);

const express = require('express');
const router = express.Router();

router.get('/', function (request, response) {
  pool.query('SELECT * FROM resort ORDER BY resort_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
});

router.get('/:id', function (request, response) {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM resort WHERE resort_id = $1 ORDER BY resort_id ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
})

module.exports = router;