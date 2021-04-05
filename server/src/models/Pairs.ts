import Database from 'better-sqlite3'
import path from 'path'

export class Pairs {
    db: Database.Database
    
    constructor(db: Database.Database) {
        this.db = db
    }
}