// Console messages are currently disabled for testing purposes.
// They should be reenabled for deployments to testnets or mainnet!
const allowConsoleLogging = true
const facetDeployed = false
const facetName = "TokenFacet"
const newFacetAddress = ""
const oldFacetAddress = "0x7CF5f3FF99C24E431CEd06f7Bc9692ec16703429"
const diamondAddress = "0x0343193dD5f992BEF9bfe82D8eE83b21bd13FD62"
const diamondInitDeployed = true
let diamondInitAddress = ethers.constants.AddressZero
let functionCall = []
let facet
const excludeFunctions = {
    TokenFacet: [
      "supportsInterface(bytes4)"
    ]
  }

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function replaceFacet() {

    const cut = []

    if(!facetDeployed) {
        const Facet = await ethers.getContractFactory(facetName)
        facet = await Facet.deploy()
        await facet.deployed()
        if(allowConsoleLogging) console.log(`${facetName} deployed: ${facet.address}`)
    } else {
        facet = await ethers.getContractAt(facetName, newFacetAddress)
    }

    const diamondLoupe = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamondAddress)

    let oldFunctionSelectors = await diamondLoupe.facetFunctionSelectors(oldFacetAddress)

    cut.push({
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: oldFunctionSelectors
    })

    const remove = excludeFunctions["TokenFacet"] ? excludeFunctions["TokenFacet"] : []

    cut.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet).remove(remove)
    })

    if (allowConsoleLogging) {
        console.log('Diamond Cut:', cut)
    }

    if(!diamondInitDeployed) {
        const DiamondInit = await ethers.getContractFactory("DiamondInit")
        const diamondInit = await DiamondInit.deploy()
        await diamondInit.deployed()
        if (allowConsoleLogging) console.log('DiamondInit deployed at', diamondInit.address)
        diamondInitAddress = diamondInit.address
        functionCall = diamondInit.interface.encodeFunctionData('initAll')
    }
    
    let tx = await diamondCut.diamondCut(cut, diamondInitAddress, functionCall)
    if (allowConsoleLogging) console.log('Diamond cut tx: ', tx.hash)
    let receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond cut failed: ${tx.hash}`)
    }
    if (allowConsoleLogging) console.log('Completed diamond cut')
}

replaceFacet().catch((error) => {
    console.error(error)
    process.exitCode = 1
})

exports.replaceFacet = replaceFacet