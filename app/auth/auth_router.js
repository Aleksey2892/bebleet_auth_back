const express = require('express')
const router = express.Router()
const AuthController = require('./AuthController')

router
  .post('/register', AuthController.register)
  .post('/login', AuthController.login)
  .post('/verify', AuthController.verifyUser)

module.exports = router
