import { run, ethers } from 'hardhat'

async function main() {
    const Sample = await ethers.getContractFactory('Arbitrage')
    const sample = await Sample.deploy(
        '0x6725F303b657a9451d8BA641348b6761A6CC7a17',
        '0x5240870Cc7A4E28eE7A79cf77d0dF69957B92da2',
        '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
        '0xb3598412392a422970D02Bd68B2Cd8eAeb41fCf3',
        { gasPrice: ethers.utils.parseUnits('10', 'gwei') }
    )  // 

    await sample.deployed()

    console.log(`Sample deployed to: ${sample.address}`)
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })