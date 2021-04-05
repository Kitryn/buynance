import assert from 'assert'

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

import { Pairs } from './models/Pairs'
const db = require('./models/DbConfig')()
const pairsDb = new Pairs(db)