const Pool = require('pg').Pool
const pool = new Pool({
  user: 'tuckerbichsel',
  host: 'localhost',
  database: 'dvc_api',
  password: 'password',
  port: 5432,
})

const getResorts = (request, response) => {
  pool.query('SELECT * FROM resort ORDER BY resort_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getRoomTypes = (request, response) => {
  pool.query('SELECT * FROM room_type ORDER BY room_type_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getRoomTypesByResort = (request, response) => {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM room_type WHERE resort_id = $1 ORDER BY room_type_id ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getViewTypes = (request, response) => {
  pool.query('SELECT * FROM view_type ORDER BY view_type_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getViewTypesByRoomType = (request, response) => {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM view_type WHERE room_type_id = $1 ORDER BY view_type_id ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getPointValuesByViewType = (request, response) => {
  const id = parseInt(request.params.id)
  pool.query('SELECT * FROM point_value WHERE view_type_id = $1 ORDER BY weekday_rate ASC', [id], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createRoomType = (request, response) => {
  const { resort_id, name, capacity } = request.body

  pool.query('INSERT INTO room_type (name, capacity, resort_id) VALUES ($1, $2, $3) returning *', [name, parseInt(capacity), parseInt(resort_id)], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`Room Type added with ID: ${results.rows[0].room_type_id}`)
  })
}

const createViewType = (request, response) => {
  const { room_type_id, name } = request.body

  pool.query('INSERT INTO view_type (name, room_type_id) VALUES ($1, $2) returning *', [name, parseInt(room_type_id)], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`View Type added with ID: ${results.rows[0].view_type_id}`)
  })
}

const createPointValues = async (request, response) => {
  const { pointValues } = request.body
  const numPointValuesAdded = await saveNewPointValue(pointValues);
  if (numPointValuesAdded > 0) {
    response.status(201).send(`${numPointValuesAdded} Point Values added.`);
  } else {
    response.status(201).send(`No new Point Values added.`);
  }
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
  getResorts,
  getRoomTypes,
  getRoomTypesByResort,
  getViewTypes,
  getViewTypesByRoomType,
  getPointValuesByViewType,
  getPointAmount,
  createRoomType,
  createViewType,
  createPointValues
}

function getDateFromString(dateArray) {
  const year = parseInt(dateArray[0])
  const month = parseInt(dateArray[1]) - 1
  const day = parseInt(dateArray[2])
  const date = new Date(year, month, day)
  return date
}

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
        `INSERT INTO point_value (weekday_rate, weekend_rate, start_date, end_date, view_type_id) Values ${expand(pointValuesToInsert.length, 5)}`,
        flatten(pointValuesToInsert), (error, results) => {
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

function expand(rowCount, columnCount, startAt=1){
  var index = startAt
  return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ")
}

function flatten(arr){
  var newArr = []
  arr.forEach(v => v.forEach(p => newArr.push(p)))
  return newArr
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
        console.log(date)
        resolve(results.rows[0].weekday_rate);
      });
  });
}
