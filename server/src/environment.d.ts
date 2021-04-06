declare global {
    namespace NodeJS {
        interface ProcessEnv{
            NODE_ENV: 'development' | 'production'
            NETWORK: 'MAINNET' | 'TESTNET'
            DBPATH: string
            DBNAME: string
            RPC_URL: string
            RPC_URL_TESTNET: string
        }
    }
}

export {}