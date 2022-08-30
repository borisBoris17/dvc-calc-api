const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const db = require('./queries')

const app = express();
app.use(cors());
const port = 3001;

const resorts = [{name:"Riviera", id:"1"}, {name:"Grand Floridian", id:"2"}];

app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.json({ info: 'Node.js, Express, and Postgres API' })
});

app.get('/resorts', db.getResorts)
app.get('/roomTypes', db.getRoomTypes)
app.get('/roomTypes/:id', db.getRoomTypesByResort)
app.get('/viewTypes', db.getViewTypes)
app.get('/viewTypes/:id', db.getViewTypesByRoomType)
app.get('/pointAmount/:id/:beginDate/:endDate', db.getPointAmount)

app.post('/roomType', db.createRoomType)
app.post('/viewType', db.createViewType)
app.post('/pointValue', db.createPointValues)
// app.put('/users/:id', db.updateUser)
// app.delete('/users/:id', db.deleteUser)

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});