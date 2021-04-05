import path from 'path'
import Database from 'better-sqlite3'

module.exports = function InitDb(): Database.Database {
    const DBNAME = process.env.NODE_ENV === 'production' ? process.env.DBNAME : `test_${process.env.DBNAME}`
    const db = new Database(path.resolve(process.env.DBPATH, DBNAME))
    db.pragma('busy_timeout = 200')
    db.pragma('foreign_keys = ON')
    return db
}