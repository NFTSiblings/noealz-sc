const diamondName = "MomentsAsia365"

// set DiamondInit to the contract address of an existing initialiser contract,
// or set it to "deploy" to have the script deploy it, or set it to false to
// deploy without an intialiser contract.
const DiamondInit = "deploy"

// List of existing facets to be added to the diamond
// If DiamondCutFacet is not listed, it will be deployed
const existingFacets = { // Goerli
  DiamondCutFacet: "",
  DiamondLoupeFacet: "",
  AdminPauseFacet: "",
  AdminPrivilegesFacet: "",
  ERC165Facet: "",
  RoyaltiesConfigFacet: "",
}

// Optionally deploy facets which exists in the facets folder but are not
// listed in the `existingFacets` object
const deployNonExistingFacets = true

// Functions to be excluded from the diamond, sorted by their facet
const excludeFunctions = {
  TokenFacet: [
    "supportsInterface(bytes4)"
  ]
}

// Facets to be excluded from the diamond
const excludeFacets = ["ExcludedFacet"]

////////////////////////////////////////////////////////////

const fs = require('fs/promises')
const path = require('path')
const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  let diamondCutFacet
  if (existingFacets.DiamondCutFacet) {
    // get existing deployed DiamondCutFacet
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', existingFacets.DiamondCutFacet)
    console.log('DiamondCutFacet exists at:', diamondCutFacet.address)
  } else {
    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
    diamondCutFacet = await DiamondCutFacet.deploy()
    await diamondCutFacet.deployed()
    console.log('DiamondCutFacet deployed:', diamondCutFacet.address)
  }

  // deploy Diamond
  const Diamond = await ethers.getContractFactory(diamondName)
  const diamond = await Diamond.deploy(diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  let diamondInit
  if (ethers.utils.isAddress(DiamondInit)) {
    // get existing deployed DiamondInit contract
    diamondInit = await ethers.getContractAt('DiamondInit', DiamondInit)
    console.log('DiamondInit contract exists at:', diamondInit.address)
  } else if (DiamondInit == "deploy") {
    // deploy DiamondInit
    const DiamondInit = await ethers.getContractFactory('DiamondInit')
    diamondInit = await DiamondInit.deploy()
    await diamondInit.deployed()
    console.log('DiamondInit deployed:', diamondInit.address)
  }
  
  const cut = []

  for (const FacetName in existingFacets) {
    if (
      FacetName == "DiamondCutFacet" ||
      excludeFacets.includes(FacetName)
    ) continue

    const facet = await ethers.getContractAt(FacetName, existingFacets[FacetName])
    console.log(`${FacetName} exists at ${facet.address}`)

    const remove = excludeFunctions[FacetName] ? excludeFunctions[FacetName] : [];

    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet).remove(remove)
    })
  }

  if (deployNonExistingFacets) {
    const FacetFileNames = await fs.readdir(path.join(path.resolve(), '/contracts/facets'))
    for (i = 0; i < FacetFileNames.length; i++) {
      let fileName = FacetFileNames[i]
      let contractName = fileName.substring(0, fileName.length - 4)
      if (
        fileName == "DiamondCutFacet.sol" ||
        excludeFacets.includes(fileName || contractName) ||
        existingFacets[contractName]
      ) continue

      let Facet = await ethers.getContractFactory(contractName)
      let facet = await Facet.deploy()
      await facet.deployed()
      console.log(`${contractName} deployed: ${facet.address}`)
      
      const remove = excludeFunctions[contractName] ? excludeFunctions[contractName] : [];

      cut.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet).remove(remove)
      })
    }
  }


  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt

  // call to init function
  if (DiamondInit) {
    let functionCall = diamondInit.interface.encodeFunctionData('initAll')
    tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  } else {
    tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, [])
  }

  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond cut failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deployDiamond().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

exports.deployDiamond = deployDiamond