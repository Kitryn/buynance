/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'
import fs from 'fs'
import path from 'path'
const privateKey = fs.readFileSync(path.resolve('..', '.secret')).toString().trim()

task('accounts', 'Prints the list of accounts', async (args, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})

const config: HardhatUserConfig = {
    networks: {
        hardhat: {},
        matic: {
            url: "https://rpc-mumbai.maticvigil.com",
            accounts: [privateKey]
        },
        bsc: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
            accounts: [privateKey]
        }
    },
    solidity: {
        compilers: [
            {
                version: '0.8.3',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999
                    }
                }
            },
            {
                version: '0.5.16'
            },
            {
                version: '0.6.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200
                    }
                }
            }
        ]
    }
}

export default config
