const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const db = require('./queries')

const app = express();
app.use(cors());
const port = 3001;

app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.json({ info: 'Node.js, Express, and Postgres API' })
});

app.get('/dvc-calc-api/resorts', db.getResorts)
app.get('/dvc-calc-api/roomTypes', db.getRoomTypes)
app.get('/dvc-calc-api/roomTypes/:id', db.getRoomTypesByResort)
app.get('/dvc-calc-api/viewTypes', db.getViewTypes)
app.get('/dvc-calc-api/viewTypes/:id', db.getViewTypesByRoomType)
app.get('/dvc-calc-api/pointValue/:id', db.getPointValuesByViewType)
app.get('/dvc-calc-api/pointAmount/:id/:beginDate/:endDate', db.getPointAmount)
app.get('/dvc-calc-api/pointBlock/:groupId', db.getPointBlocks);
app.get('/dvc-calc-api/pointBlockGroup', db.getPointBlockGroups);

app.post('/dvc-calc-api/roomType', db.createRoomType)
app.post('/dvc-calc-api/viewType', db.createViewType)
app.post('/dvc-calc-api/pointValue', db.createPointValues)
app.post('/dvc-calc-api/pointBlock', db.createPointBlock)
// app.put('/users/:id', db.updateUser)
// app.delete('/users/:id', db.deleteUser)

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});