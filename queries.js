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
    console.log("here?")
    const amountForDay = await fetchPointsForNight(viewTypeId, beginDate);
    totalPointsNeeded = totalPointsNeeded + amountForDay;
    beginDate.setDate(beginDate.getDate() + 1);
  }
  responseObj['numPoints'] = totalPointsNeeded
  response.status(200).json(responseObj)
}

// response object 
// {
//  resorts: [
//    {
//      resortId:
//      resortName:
//      roomTypes: [
//        {
//          roomTypeId:
//          roomTypeName:
//          viewTypes: [
//            {
//              viewTypeId:
//              viewTypeName
//              dates: [
//                {
//                  date:
//                  points:    
//                },
//                ...
//              ]        
//            },
//            ...
//          ]
//        }, 
//        ...
//       ]
//    },
//    ...
//  ] 
// }
const getAllPointAmounts = async (request, response) => {
  const beginDate = getDateFromString(request.params.beginDate.split('-'))
  const endDate = getDateFromString(request.params.endDate.split('-'))
  // if (beginDate >= endDate) {
  //   response.status(400).send()
  // } 
  const responseObj = {
    beginDate: request.params.beginDate,
    endDate: request.params.endDate
  }
  // get all the resorts
  const resorts = await fetchAllResorts();
  // for each resort 
  const resortArray = [];
  await Promise.all(resorts.map(async resort =>  {
    // add the resort_id and name to response obj 

    // get all the room types
    const roomTypes = await fetchAllRoomTypesForResort(resort.resort_id);
    // for each room_type
    let roomTypeArray = [];
    await Promise.all(roomTypes.map(async roomType => {
      // add the id and name to response obj
      
      // get all view types
      const viewTypes = await fetchAllViewTypesForRoomType(roomType.room_type_id);
      //for each view_type
      const viewTypeArray = []
      await Promise.all(viewTypes.map(async viewType => {
        // add the id and name to response obj
        // for each day get the points needed for that day
        let currentDate = new Date(beginDate);
        let totalPointsNeeded = 0;
        let dates = [];
        while (currentDate < endDate) {
          const amountForDay = await fetchPointsForNight(viewType.view_type_id, currentDate);
          // add the date need for that day to the response obj
          
          // total the amount for the whole stay
          totalPointsNeeded = totalPointsNeeded + amountForDay;
          // add the points need for that day to the response obj
          dates.push({
            date: currentDate.toLocaleDateString(),
            points: amountForDay
          })
          currentDate.setDate(currentDate.getDate() + 1);
        }
        viewTypeArray.push({
          view_type_id: viewType.view_type_id,
          view_type_name: viewType.name,
          totalPoints: totalPointsNeeded,
          dates: dates
        });
      }))
      roomTypeArray.push({
        room_type_id: roomType.room_type_id,
        room_type_name: roomType.name,
        viewTypes: viewTypeArray
      })
    }))
    resortArray.push({
      resort_id: resort.resort_id,
      resort_name: resort.name,
      roomTypes: roomTypeArray
    })
  }));
  responseObj['resorts'] = resortArray;
  response.status(200).json(responseObj)
}

module.exports = {
  getPointBlockGroups,
  getDateRangesByPointBlockId,
  getPointAmount,
  getAllPointAmounts,
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
          console.log(results.rows[0]?.weekend_rate)
          resolve(results.rows[0]?.weekend_rate);
        }
        console.log(results.rows[0]?.weekday_rate)
        resolve(results.rows[0]?.weekday_rate);
      });
  });
}

function fetchAllResorts() {
  return new Promise(resolve => {
    pool.query('SELECT * FROM resort ORDER BY resort_id ASC',
      (error, results) => {
        if (error) {
          throw error
        }
        resolve(results.rows);
      });
  });
}

function fetchAllRoomTypesForResort(resortId) {
  return new Promise(resolve => {
    pool.query('SELECT * FROM room_type WHERE resort_id = $1 ORDER BY room_type_id ASC', [resortId],
      (error, results) => {
        if (error) {
          throw error
        }
        resolve(results.rows);
      });
  });
}

function fetchAllViewTypesForRoomType(roomTypeId) {
  return new Promise(resolve => {
    pool.query('SELECT * FROM view_type WHERE room_type_id = $1 ORDER BY view_type_id ASC', [roomTypeId],
      (error, results) => {
        if (error) {
          throw error
        }
        resolve(results.rows);
      });
  });
}