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
    solidity: '0.8.3'
}

export default config
