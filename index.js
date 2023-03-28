const express = require('express');
const mongoose = require('mongoose')
const winston = require('winston')
const morgan = require('morgan')
const Schema = mongoose.Schema;
const app = express();

app.set('view engine', 'ejs')
app.set('views', 'views')

const url = "mongodb://mongo:b2MnlaWnl3fVthkXd9nq@containers-us-west-182.railway.app:6995";

mongoose.connect(url).then(() => {
  console.log("Connected")
}).catch(error => {
  console.log(error)
})

// define schema 
const logSchema = new Schema({
  user: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})
// create logger model 
const Log = mongoose.model('log', logSchema)

// setup winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'request.log' })
  ]
})

// define function to count requests
const countRequest = (req, res, next) => {
  let user = req.ip;

  Log.findOne({ user }).then(log => {
    if (!log) {
      // create one
      log = new Log({ user, count: 0 });
    }
    log.count++;
    // save log to database [mongodb]
    log.save().then(saved => {
      console.log(saved)
      logger.info({ user, count: log.count });
      next()
    }).catch(error => {
      console.log(error)
      next(error)
    })

  }).catch(err => {
    console.log('Error Occured')
  })

}


app.use(countRequest)
app.use(morgan('combined'))


app.get('/', async (req, res) => {
  const logs = await Log.find({})
  console.log(logs)
  res.render('index', { logs })
});

app.listen(3000, () => {
  console.log('server started');
});
