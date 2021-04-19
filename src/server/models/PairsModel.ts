import Database from 'better-sqlite3'
import { Pair, Token } from '../types'

export class PairsModel {
    db: Database.Database
    
    constructor(db: Database.Database) {
        this.db = db
        const createFactoryTable = this.db.prepare('CREATE TABLE IF NOT EXISTS factories(\
            name TEXT UNIQUE,\
            contract_address TEXT UNIQUE NOT NULL,\
            router_address TEXT UNIQUE NOT NULL,\
            fee REAL NOT NULL)')
        
        const createTokenTable = this.db.prepare('CREATE TABLE IF NOT EXISTS tokens(\
            decimals INTEGER NOT NULL,\
            name TEXT NOT NULL,\
            symbol TEXT NOT NULL,\
            contract_address TEXT UNIQUE NOT NULL,\
            is_base INTEGER NOT NULL DEFAULT 0)')
        
        const createPairsTable = this.db.prepare('CREATE TABLE IF NOT EXISTS pairs(\
            pair_index INTEGER NOT NULL,\
            decimals INTEGER NOT NULL,\
            token0_address TEXT NOT NULL,\
            token1_address TEXT NOT NULL,\
            factory_address TEXT NOT NULL,\
            contract_address TEXT UNIQUE NOT NULL,\
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

    addFactory(name: string, address: string, router_address: string, fee: number) {
        const query = this.db.prepare('INSERT OR IGNORE INTO factories(name, contract_address, router_address, fee) VALUES (\
            :name,\
            :contract_address,\
            :router_address,\
            :fee)')
        const result = query.run({
            name: name,
            contract_address: address.toLowerCase(),
            router_address: router_address.toLowerCase(),
            fee: fee
        })  // todo: inspect result to check success?
    }

    getFactory(address: string) {
        const query = this.db.prepare('SELECT * FROM factories WHERE contract_address=:address')
        const result = query.get({address: address.toLowerCase()})
        return result
    }

    getFactories() {
        const query = this.db.prepare('SELECT * FROM factories')
        const result = query.all()
        return result
    }

    addToken(tokenInfo: Token) {
        const query = this.db.prepare('INSERT OR IGNORE INTO tokens(\
                decimals,\
                name,\
                symbol,\
                contract_address) \
            VALUES (\
                :decimals,\
                :name,\
                :symbol,\
                :contract_address)')
        const input = {...tokenInfo}
        input.contract_address = input.contract_address.toLowerCase()
        
        const result = query.run(input)  // todo: inspect result to check success?
    }

    addPair(pairInfo: Pair) {
        const query = this.db.prepare('INSERT INTO pairs(\
                pair_index,\
                decimals,\
                token0_address,\
                token1_address,\
                factory_address,\
                contract_address) \
            VALUES(\
                :pair_index,\
                :decimals,\
                :token0_address,\
                :token1_address,\
                :factory_address,\
                :contract_address)')
        const input = {...pairInfo}
        input.contract_address = input.contract_address.toLowerCase()
        input.factory_address = input.factory_address.toLowerCase()
        input.token0_address = input.token0_address.toLowerCase()
        input.token1_address = input.token1_address.toLowerCase()

        if (input.pair_index == null) input.pair_index = null

        const result = query.run(input)  // todo: inspect result to check success?
    }

    getTokenFromAddress(address: string) {
        const key = address.toLowerCase()
        const query = this.db.prepare('SELECT * FROM tokens WHERE contract_address=:address')
        const result = query.get({address: key})
        return result
    }

    getTokenAddressList() {
        const query = this.db.prepare('SELECT contract_address FROM tokens')
        const result = query.pluck().all()
        return result
    }

    getPairFromAddress(address: string) {
        const key = address.toLowerCase()
        const query = this.db.prepare('SELECT * FROM pairs WHERE contract_address=:address')
        const result = query.get({address: key})
        return result
    }

    getPairIndexAddressList(factoryAddress: string) {
        const key = factoryAddress.toLowerCase()
        const query = this.db.prepare('SELECT contract_address, pair_index FROM pairs WHERE factory_address=:address')
        const result = query.all({address: key})
        return result
    }

    getCommonPairs() {
        const query = this.db.prepare("SELECT *, token0_address || ';' || token1_address AS _pair FROM pairs \
            WHERE (\
                token0_address || ';' ||  token1_address in (\
                    SELECT token0_address || ';' || token1_address AS slug FROM pairs \
                    WHERE (\
                        token0_address in (\
                            SELECT contract_address FROM tokens WHERE is_base=1\
                        ) OR \
                        token1_address in (\
                            SELECT contract_address FROM tokens WHERE is_base=1\
                        )\
                    ) GROUP BY slug HAVING count(slug)>1\
                )\
            )\
            ORDER BY token0_address, token1_address"
        )
        const result = query.all()
        const pairs: Map<string, Pair[]> = new Map()

        for (const _pair of result) {
            if (pairs.has(_pair._pair) === false) {
                pairs.set(_pair._pair, [])
            }
            pairs.get(_pair._pair)?.push(_pair)
        }

        return pairs
    }

    getPairTicker(contractAddress: string) {
        const query = this.db.prepare("SELECT token0_address, token1_address FROM pairs \
            WHERE contract_address = :contractAddress\
        ")
        const result = query.get({contractAddress: contractAddress.toLowerCase()})
        
        const query2 = this.db.prepare("SELECT group_concat(symbol, '/') FROM tokens \
            WHERE contract_address = :token0 OR \
            contract_address = :token1 \
            ORDER BY contract_address")
        
        const result2 = query2.pluck().get({
            token0: result.token0_address,
            token1: result.token1_address
        })
        return result2
    }
}