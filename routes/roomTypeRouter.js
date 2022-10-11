const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);

const express = require('express');
const router = express.Router();

router.get('/', function (request, response) {
  pool.query('SELECT * FROM room_type ORDER BY room_type_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
});

router.get('/:resortId', function (request, response) {
  const resortId = parseInt(request.params.resortId)
  pool.query('SELECT * FROM room_type WHERE resort_id = $1 ORDER BY room_type_id ASC', [resortId], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
})

router.post('/', function (request, response) {
  const { resort_id, name, capacity } = request.body

  pool.query('INSERT INTO room_type (name, capacity, resort_id) VALUES ($1, $2, $3) returning *', [name, parseInt(capacity), parseInt(resort_id)], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`Room Type added with ID: ${results.rows[0].room_type_id}`)
  });
})

module.exports = router;