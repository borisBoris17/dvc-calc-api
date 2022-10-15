const Pool = require('pg').Pool
const config = require('../config');
const pool = new Pool(config.db);

const express = require('express');
const router = express.Router();
const util = require('../utils/util');
const auth = require("../middleware/auth");

router.get('/:id', function (request, response) {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM point_value WHERE view_type_id = $1 ORDER BY weekday_rate ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  });
});

router.post('/', auth, async function (request, response) {
  const { pointValues } = request.body
  const numPointValuesAdded = await saveNewPointValue(pointValues);
  if (numPointValuesAdded > 0) {
    response.status(201).send(`${numPointValuesAdded} Point Values added.`);
  } else {
    response.status(201).send(`No new Point Values added.`);
  }
})

router.post('/table', auth, async function (request, response) {
  const { pointValuesFromTable } = request.body
  const dateRanges = await saveNewPointValueFromTable(pointValuesFromTable);
  if (dateRanges != undefined) {
    response.status(201).send(`${dateRanges} Point Values added.`);
  } else {
    response.status(201).send(`No new Point Values added.`);
  }
})

function saveNewPointValue(pointValues) {
  return new Promise(resolve => {
    const pointValuesToInsert = []
    pointValues.map(pointValue => {
      if (parseInt(pointValue.point_value_id) < 0) {
        let startDate = new Date();
        let startDateArray = pointValue.start_date.split('-');
        startDate.setFullYear(startDateArray[0]);
        startDate.setMonth(startDateArray[1] - 1);
        startDate.setDate(startDateArray[2]);

        let endDate = new Date();
        let endDateArray = pointValue.end_date.split('-');
        endDate.setFullYear(endDateArray[0]);
        endDate.setMonth(endDateArray[1] - 1);
        endDate.setDate(endDateArray[2]);
        pointValuesToInsert.push([parseInt(pointValue.weekday_rate), parseInt(pointValue.weekend_rate), startDate, endDate, parseInt(pointValue.view_type_id)]);
      }
    });
    if (pointValuesToInsert.length > 0) {
      pool.query(
        `INSERT INTO point_value (weekday_rate, weekend_rate, start_date, end_date, view_type_id) Values ${util.expand(pointValuesToInsert.length, 5)}`,
        util.flatten(pointValuesToInsert), (error, results) => {
          if (error) {
            throw error
          }
          resolve(pointValuesToInsert.length);
        });
    } else {
      resolve(0);
    }
  });
}

function saveNewPointValueFromTable(pointValuesFromTable) {
  return new Promise(async resolve => {
    const pointValuesToInsert = await buildListOfPointValuesToInsert(pointValuesFromTable);
    let numOfPointValuesCreated = await createNewPointValueFromTable(pointValuesToInsert);
    resolve(numOfPointValuesCreated);
  });

}

function buildListOfPointValuesToInsert(pointValuesFromTable) {
  return new Promise( async resolve => {
    const pointValuesToInsert = [];
    const promises = pointValuesFromTable.map(async (pointValueFromTable) => {
      const newValuesToInsert = await getDateRangeById(pointValueFromTable.point_block_id, pointValueFromTable)
      return pointValuesToInsert.push(...newValuesToInsert);
    });
    await Promise.all(promises);
    resolve(pointValuesToInsert);
  });
}

function getDateRangeById(pointBlockId, pointValueFromTable) {
  return new Promise(resolve => {
    pool.query(
      'SELECT * FROM date_range WHERE point_block_id = $1 ORDER BY start_date ASC', [pointBlockId], (error, results) => {
        if (error) {
          throw error
        }
        const newPointValuesToInsert = [];
        results.rows.map((dateRange) => {
          let newPointValue = buildPointValueToAdd(dateRange, pointValueFromTable);
          newPointValuesToInsert.push(newPointValue);
        });
        resolve(newPointValuesToInsert)
      }
    )
  })
}

function buildPointValueToAdd(dateRange, pointValueFromTable) {
  return {
    view_type_id: pointValueFromTable.view_type_id,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date,
    weekday_rate: pointValueFromTable.weekday_rate,
    weekend_rate: pointValueFromTable.weekend_rate,
  }
}

function createNewPointValueFromTable(pointValues) {
  return new Promise(resolve => {
    const pointValuesToInsert = []
    pointValues.map(pointValue => {
      pointValuesToInsert.push([parseInt(pointValue.weekday_rate), parseInt(pointValue.weekend_rate), pointValue.start_date, pointValue.end_date, parseInt(pointValue.view_type_id)]);
    });
    if (pointValuesToInsert.length > 0) {
      pool.query(
        `INSERT INTO point_value (weekday_rate, weekend_rate, start_date, end_date, view_type_id) Values ${util.expand(pointValuesToInsert.length, 5)}`,
        util.flatten(pointValuesToInsert), (error, results) => {
          if (error) {
            throw error
          }
          resolve(pointValuesToInsert.length);
        });
    } else {
      resolve(0);
    }
  });
}

module.exports = router;