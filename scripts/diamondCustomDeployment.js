const diamondName = "MomentsAsia365"

// set DiamondInit to the contract address of an existing initialiser contract,
// or set it to "deploy" to have the script deploy it, or set it to false to
// deploy without an intialiser contract.
const DiamondInit = "deploy"

// List of existing facets to be added to the diamond
// If DiamondCutFacet is not listed, it will be deployed
const existingFacets = { // Goerli
  DiamondCutFacet: "0x29838A3dF88653B533c4E79f1891BAd7CDEe72aF",
  DiamondLoupeFacet: "0x5D19C3148BA8704D1723653a188afEcD1c4EeD5e",
  AdminPauseFacet: "0x73656E7165508285b85dBD37F8B5625428C2466e",
  AdminPrivilegesFacet: "0xb7e873970EE2A67536E214C4677fB7Bc0E8456b9",
  AllowlistFacet: "0xbd5784f3D062f340A152E08E93143Be18745f81D",
  ERC165Facet: "0xD3040d1427E301796BFA03199dAb811187a7A976",
  RoyaltiesConfigFacet: "0xc2d5f5ED8AAe1708619eb01D4002D9A01E55CF7D",
  PaymentSplitterFacet: "0x625d8a647541e9f89F7a94d073A733C65e8dc742",
  TokenFacet: "0x23D34A3CACcfc690257E7d0CB7C0CbE83Fe5Ae2B"
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