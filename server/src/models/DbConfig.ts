import path from 'path'
import Database from 'better-sqlite3'

module.exports = function InitDb(): Database.Database {
    const db = new Database(path.resolve(process.env.DBPATH, process.env.DBNAME))
    db.pragma('busy_timeout = 200')
    return db
}