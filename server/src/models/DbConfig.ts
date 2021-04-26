import path from 'path'
import Database from 'better-sqlite3'

module.exports = function InitDb(): Database.Database {
    const DBNAME = process.env.NETWORK === 'MAINNET' ? process.env.DBNAME : `TESTNET_${process.env.DBNAME}`
    const db = new Database(path.resolve(process.env.DBPATH, DBNAME))
    db.pragma('busy_timeout = 200')
    db.pragma('foreign_keys = ON')
    return db
}