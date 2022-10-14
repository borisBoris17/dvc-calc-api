const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);

const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");

router.get('/', function (request, response) {
  pool.query('SELECT * FROM view_type ORDER BY view_type_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
});

router.get('/:id', function (request, response) {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM view_type WHERE room_type_id = $1 ORDER BY view_type_id ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
})


router.post('/', auth, function (request, response) {
  const { room_type_id, name } = request.body

  pool.query('INSERT INTO view_type (name, room_type_id) VALUES ($1, $2) returning *', [name, parseInt(room_type_id)], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`View Type added with ID: ${results.rows[0].view_type_id}`)
  })
})

module.exports = router;