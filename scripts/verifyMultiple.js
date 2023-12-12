const logErrors = false;
const contracts = { // Goerli
    Diamond: {
        address: "0x0343193dD5f992BEF9bfe82D8eE83b21bd13FD62",
        arguments: ["0x29838A3dF88653B533c4E79f1891BAd7CDEe72aF"]
    },
    DiamondInit: { address: "0xC049c93a3BC3ecAFc18E5cbbAF49D0d433DEc66e" },
    DiamondCutFacet: { address: "0x29838A3dF88653B533c4E79f1891BAd7CDEe72aF" },
    DiamondLoupeFacet: { address: "0x5D19C3148BA8704D1723653a188afEcD1c4EeD5e" },
    AdminPauseFacet: { address: "0x73656E7165508285b85dBD37F8B5625428C2466e" },
    AdminPrivilegesFacet: { address: "0xb7e873970EE2A67536E214C4677fB7Bc0E8456b9" },
    AllowlistFacet: { address: "0xbd5784f3D062f340A152E08E93143Be18745f81D" },
    ERC165Facet: { address: "0xD3040d1427E301796BFA03199dAb811187a7A976" },
    RoyaltiesConfigFacet: { address: "0xc2d5f5ED8AAe1708619eb01D4002D9A01E55CF7D" },
    PaymentSplitterFacet: { address: "0x625d8a647541e9f89F7a94d073A733C65e8dc742" },
    TokenFacet: { address: "0x7CF5f3FF99C24E431CEd06f7Bc9692ec16703429" }
}

////////////////////////////////////////////////////////////

async function main() {
    for (contract in contracts) {
        console.log("Verifying " + contract + " at " + contracts[contract].address)

        try {

            await hre.run("verify:verify", {
                address: contracts[contract].address,
                constructorArguments: contracts[contract].arguments
            })

        } catch (err) {

            console.error("Failed to verify " + contract)
            if (logErrors) console.log(err)

        }
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})