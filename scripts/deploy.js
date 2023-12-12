async function main() {

    const [deployer] = await ethers.getSigners()
  
    const Contract = await ethers.getContractFactory("testToken")
    const contract = await Contract.deploy()
  
    console.log(`TestToken deployed: ${contract.address}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })