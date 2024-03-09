const { unlinkSync } = require('fs')
const sqlite3 = require('sqlite3').verbose()

const dbPath = './localDB/db.db'
const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      last_name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT
    )
  `)
})

process.on('SIGINT', async () => {
  try {
    await db.close()
    console.info('SQLite connection closed')

    unlinkSync(dbPath)
    console.info('SQLite database file deleted')

    console.info('App exit')
    process.exit(1)
  } catch (error) {
    console.error('Error during app shutdown:', error.message)
    process.exit(1)
  }
})

module.exports = db
