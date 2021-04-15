/**
 * @type import('hardhat/config').HardhatUserConfig
 */
import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-waffle'

task('accounts', 'Prints the list of accounts', async (args, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: '0.8.3'
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
