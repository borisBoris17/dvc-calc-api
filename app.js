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

app.get('/dvc-api/resorts', db.getResorts)
app.get('/dvc-api/roomTypes', db.getRoomTypes)
app.get('/dvc-api/roomTypes/:id', db.getRoomTypesByResort)
app.get('/dvc-api/viewTypes', db.getViewTypes)
app.get('/dvc-api/viewTypes/:id', db.getViewTypesByRoomType)
app.get('/dvc-api/pointValue/:id', db.getPointValuesByViewType)
app.get('/dvc-api/pointAmount/:id/:beginDate/:endDate', db.getPointAmount)

app.post('/dvc-api/roomType', db.createRoomType)
app.post('/dvc-api/viewType', db.createViewType)
app.post('/dvc-api/pointValue', db.createPointValues)
// app.put('/users/:id', db.updateUser)
// app.delete('/users/:id', db.deleteUser)

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});