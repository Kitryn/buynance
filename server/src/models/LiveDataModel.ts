import Database from 'better-sqlite3'
import { Pair, Token } from '../types/types'

export class LiveDataModel {
    db: Database.Database

    constructor(db: Database.Database) {
        this.db = db

        // Assumes the tables in PairsModel have already been created
        const createLiveTable = this.db.prepare('CREATE TABLE IF NOT EXISTS livedata(\
            token0reserves REAL NOT NULL,\
            token1reserves REAL NOT NULL,\
            pair_address STRING NOT NULL,\
            FOREIGN KEY (pair_address) \
                REFERENCES pairs(contract_address)\
        )')

        const initialiseDb = this.db.transaction(() => {
            createLiveTable.run()
        })
        initialiseDb()
    }

    addOrUpdateData(pair_address: string, token0reserves: number, token1reserves: number) {
        const upsert = this.db.prepare('INSERT INTO livedata VALUES( \
            :token0reserves,\
            :token1reserves,\
            :pair_address) \
            ON CONFLICT (pair_addess) DO UPDATE SET (\
                token0reserves=excluded.token0reserves, \
                token1reserves=excluded.token1reserves\
            )')
        // todo -- bignumber.js?
    }
}