const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const db = require('./queries')
const resortRouter = require('./routes/resortRouter')
const roomTypeRouter = require('./routes/roomTypeRouter')
const viewTypeRouter = require('./routes/viewTypeRouter')
const pointBlockRouter = require('./routes/pointBlockRouter')
const pointValueRouter = require('./routes/pointValueRouter')

const app = express();
app.use(cors());
const port = 3001;

app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.json({ info: 'Node.js, Express, and Postgres API' })
});

app.use('/dvc-calc-api/resort', resortRouter)
app.use('/dvc-calc-api/roomType', roomTypeRouter)
app.use('/dvc-calc-api/viewType', viewTypeRouter)
app.use('/dvc-calc-api/pointBlock', pointBlockRouter)
app.use('/dvc-calc-api/pointValue', pointValueRouter)

app.get('/dvc-calc-api/pointAmount/:id/:beginDate/:endDate', db.getPointAmount)
app.get('/dvc-calc-api/pointBlockGroup', db.getPointBlockGroups);
app.get('/dvc-calc-api/dateRange/:id', db.getDateRangesByPointBlockId);

// app.put('/users/:id', db.updateUser)
// app.delete('/users/:id', db.deleteUser)

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});