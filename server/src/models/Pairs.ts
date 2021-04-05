import Database from 'better-sqlite3'
import path from 'path'

export class Pairs {
    db: Database.Database
    
    constructor(db: Database.Database) {
        this.db = db
        const createFactoryTable = this.db.prepare('CREATE TABLE IF NOT EXISTS factories(\
            name STRING UNIQUE,\
            contract_address STRING UNIQUE NOT NULL,\
            factory_id INTEGER PRIMARY KEY)')
        
        const createTokenTable = this.db.prepare('CREATE TABLE IF NOT EXISTS tokens(\
            decimals INTEGER NOT NULL,\
            name STRING NOT NULL,\
            symbol STRING NOT NULL,\
            contract_address STRING UNIQUE NOT NULL)')
        
        const createPairsTable = this.db.prepare('CREATE TABLE IF NOT EXISTS pairs(\
            decimals INTEGER NOT NULL,\
            token0_address STRING NOT NULL,\
            token1_address STRING NOT NULL,\
            factory_address STRING NOT NULL,\
            contract_address STRING UNIQUE NOT NULL,\
            FOREIGN KEY (factory_address)\
                REFERENCES factories (contract_address),\
            FOREIGN KEY (token0_address)\
                REFERENCES tokens (contract_address),\
            FOREIGN KEY (token1_address)\
                REFERENCES tokens (contract_address))')
        
        const initialiseDb = this.db.transaction(() => {
            createFactoryTable.run()
            createTokenTable.run()
            createPairsTable.run()
        })
        initialiseDb()
    }
}