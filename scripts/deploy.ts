import { run, ethers } from 'hardhat'

async function main() {
    const Sample = await ethers.getContractFactory('Arbitrage')
    const sample = await Sample.deploy({gasPrice: ethers.utils.parseUnits('5', 'gwei')})  // 

    await sample.deployed()

    console.log(`Sample deployed to: ${sample.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })