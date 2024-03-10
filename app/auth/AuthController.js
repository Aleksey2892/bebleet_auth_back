const HttpCodes = require('../../helpers/http_codes')
const db = require('../../api/db_connection')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

require('dotenv').config()
const SECRET_KEY = process.env.TOKEN_SECRET_WORD

class AuthController {
  constructor() {}

  register = async (req, res, _next) => {
    const { firstName, lastName, email, phone, password } = req.body

    try {
      const emailExists = await new Promise((resolve, reject) => {
        db.get(
          'SELECT email FROM users WHERE email = ?',
          [email],
          (err, row) => {
            if (err) {
              reject(err)
              return
            }

            resolve(row)
          },
        )
      })

      if (emailExists) {
        return res
          .status(HttpCodes.BAD_REQUEST)
          .json({ error: 'User with this email already exists' })
      }

      await bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('Password generate error:', err.message)
          return res
            .status(HttpCodes.SERVER_ERROR)
            .json({ error: 'Password generate error' })
        }

        db.run(
          `INSERT INTO users (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)`,
          [firstName, lastName, email, phone, hash],
          err => {
            if (err) {
              console.error('DB registration error:', err.message)
              return res
                .status(HttpCodes.SERVER_ERROR)
                .json({ error: 'Internal Server Error' })
            }

            res.status(HttpCodes.CREATED).json({
              status: 'success',
              code: HttpCodes.CREATED,
              message: 'User registered successfully',
            })
          },
        )
      })
    } catch (e) {
      console.error('User registration error:', e.message)
      res
        .status(HttpCodes.SERVER_ERROR)
        .json({ error: 'Internal Server Error' })
    }
  }

  login = async (req, res, _next) => {
    const { email, password } = req.body

    try {
      const userExists = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
          if (err) {
            reject(err)
            return
          }

          resolve(row)
        })
      })

      if (userExists) {
        await bcrypt.compare(
          password,
          userExists.password,
          function (err, result) {
            if (err) {
              console.error('Password unhash error:', err.message)
              return res
                .status(HttpCodes.SERVER_ERROR)
                .json({ error: 'Password unhash error' })
            }
            if (!result) {
              return res
                .status(HttpCodes.BAD_REQUEST)
                .json({ error: `Wrong password` })
            }

            const payload = {
              id: userExists.id,
              email: userExists.email,
            }
            const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' })

            return res.status(HttpCodes.OK).json({
              status: 'success',
              code: HttpCodes.OK,
              data: { token },
            })
          },
        )
      } else {
        return res
          .status(HttpCodes.BAD_REQUEST)
          .json({ error: `No user user with this email "${email}"` })
      }
    } catch (e) {
      res
        .status(HttpCodes.SERVER_ERROR)
        .json({ error: 'Internal Server Error' })
    }
  }

  verifyUser = async (req, res, _next) => {
    const { token } = req.body

    if (!token) {
      return res
        .status(HttpCodes.FORBIDDEN)
        .json({ error: `You don't have access"` })
    }

    const verify = jwt.verify(token, SECRET_KEY)

    try {
      const userExists = await new Promise((resolve, reject) => {
        db.get(
          'SELECT email FROM users WHERE email = ?',
          [verify.email],
          (err, row) => {
            if (err) {
              reject(err)
              return
            }

            resolve(row)
          },
        )
      })

      if (userExists) {
        return res.status(HttpCodes.OK).json({
          status: 'verify success',
          code: HttpCodes.OK,
          data: { token },
        })
      } else {
        return res
          .status(HttpCodes.BAD_REQUEST)
          .json({ error: `Token verify failed"` })
      }
    } catch (e) {
      res
        .status(HttpCodes.SERVER_ERROR)
        .json({ error: 'Internal Server Error' })
    }
  }
}

module.exports = new AuthController()
