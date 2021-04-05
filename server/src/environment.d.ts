declare global {
    namespace NodeJS {
        interface ProcessEnv{
            NODE_ENV: 'development' | 'production'
            DBPATH: string
            DBNAME: string
        }
    }
}

export {}