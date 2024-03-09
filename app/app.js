const express = require('express')
const cors = require('cors')
const logger = require('morgan')
const limiter = require('../helpers/limiter')
const HttpCodes = require('../helpers/http_codes')

const auth_router = require('./auth/auth_router')

const PORT = process.env.PORT ?? 3000

const app = express()
const loggerFormat = app.get('env') === 'development' ? 'dev' : 'short'

app.use(cors())
app.use(limiter)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(logger(loggerFormat))

app.use('/', auth_router)

app.use((_req, res) => {
  res.status(HttpCodes.NOT_FOUND).json({ message: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
})

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason)
})
