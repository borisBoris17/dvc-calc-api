const Pool = require('pg').Pool
const config = require('./config');
const pool = new Pool(config.db);
const util = require('./utils/util');

const getPointBlockGroups = (request, response) => {
  pool.query('SELECT * FROM point_block_group ORDER BY point_block_group_name ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getDateRangesByPointBlockId = (request, response) => {
  const pointBlockId = parseInt(request.params.id)
  pool.query('SELECT * FROM date_range WHERE point_block_id = $1 ORDER BY start_date ASC', [pointBlockId], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getPointAmount = async (request, response) => {
  const responseObj = {};
  let totalPointsNeeded = 0;
  const viewTypeId = parseInt(request.params.id)
  const beginDate = getDateFromString(request.params.beginDate.split('-'))
  const endDate = getDateFromString(request.params.endDate.split('-'))
  while (beginDate < endDate) {
    const amountForDay = await fetchPointsForNight(viewTypeId, beginDate);
    totalPointsNeeded = totalPointsNeeded + amountForDay;
    beginDate.setDate(beginDate.getDate() + 1);
  }
  responseObj['numPoints'] = totalPointsNeeded
  response.status(200).json(responseObj)
}

const updateUser = (request, response) => {
  const id = parseInt(request.params.id)
  const { name, email } = request.body

  pool.query(
    'UPDATE users SET name = $1, email = $2 WHERE id = $3',
    [name, email, id],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

const deleteUser = (request, response) => {
  const id = parseInt(request.params.id)

  pool.query('DELETE FROM users WHERE id = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`User deleted with ID: ${id}`)
  })
}

module.exports = {
  getPointBlockGroups,
  getDateRangesByPointBlockId,
  getPointAmount,
}

function getDateFromString(dateArray) {
  const year = parseInt(dateArray[0])
  const month = parseInt(dateArray[1]) - 1
  const day = parseInt(dateArray[2])
  const date = new Date(year, month, day)
  return date
}

function fetchPointsForNight(viewTypeId, date) {
  return new Promise(resolve => {
    pool.query('SELECT * FROM point_value WHERE view_type_id = $1 and start_date <= $2 and end_date >= $2 ORDER BY view_type_id ASC',
      [viewTypeId, date], (error, results) => {
        if (error) {
          throw error
        }
        if (date.getDay() == 5 || date.getDay() == 6) {
          resolve(results.rows[0].weekend_rate);
        }
        resolve(results.rows[0].weekday_rate);
      });
  });
}