const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);

const express = require('express');
const router = express.Router();
const util = require('../utils/util');

router.get('/:groupId/:year', function (request, response) {
  const groupId = parseInt(request.params.groupId);
  const year = parseInt(request.params.year);
  pool.query('SELECT * FROM point_block WHERE point_block_group_id = $1 and point_block_year = $2 ORDER BY value_index ASC', [groupId, year], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows);
  });
});

router.get('/', function (request, response) {
  pool.query('SELECT * FROM view_type ORDER BY view_type_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
});

router.post('/', function (request, response) {
  const { pointBlockGroupId, pointBlockYear, valueIndex, dateRanges } = request.body;
  savePointBlock(pointBlockGroupId, pointBlockYear, valueIndex).then(async (pointBlockId) => {
    const numDateRangesInserted = await saveNewDateRangeForPointBlock(pointBlockId, dateRanges);
    if (numDateRangesInserted > 0) {
      response.status(200).send(`${numDateRangesInserted} Date Ranges added.`);
    } else {
      response.status(201).send(`No new Date Ranges added.`);
    }
  });
})

const savePointBlock = async (pointBlockGroupId, pointBlockYear, valueIndex) => {
  return new Promise(function (resolve, reject) {
    pool.query('INSERT INTO point_block (point_block_group_id, point_block_year, value_index) VALUES ($1, $2, $3) returning *', [parseInt(pointBlockGroupId), parseInt(pointBlockYear), parseInt(valueIndex)], (err, res) => {
      if (err) {
        console.log('Error saving to db: ' + err);
        reject(0)
      } else {
        resolve(res.rows[0].point_block_id)
      }
    });
  });
}

function saveNewDateRangeForPointBlock(pointBlockId, dateRanges) {
  return new Promise(resolve => {
    const dateRangesToInsert = []
    dateRanges.map(dateRange => {
      if (parseInt(dateRange.date_range_id) < 0) {
        let startDate = new Date();
        let startDateArray = dateRange.start_date.split('-');
        startDate.setFullYear(startDateArray[0]);
        startDate.setMonth(startDateArray[1] - 1);
        startDate.setDate(startDateArray[2]);

        let endDate = new Date();
        let endDateArray = dateRange.end_date.split('-');
        endDate.setFullYear(endDateArray[0]);
        endDate.setMonth(endDateArray[1] - 1);
        endDate.setDate(endDateArray[2]);
        dateRangesToInsert.push([startDate, endDate, parseInt(pointBlockId), dateRange.date_range_desc]);
      }
    });
    if (dateRangesToInsert.length > 0) {
      pool.query(
        `INSERT INTO date_range (start_date, end_date, point_block_id, date_range_desc) Values ${util.expand(dateRangesToInsert.length, 4)}`,
        util.flatten(dateRangesToInsert), (error, results) => {
          if (error) {
            throw error
          }
          resolve(dateRangesToInsert.length);
        });
    } else {
      resolve(0);
    }
  });
}

module.exports = router;