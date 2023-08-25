const logErrors = false;
const contracts = { // Goerli
    Diamond: {
        address: "0xb20a9918a821171b574156B72bE268ee30DC3331",
        arguments: ["0xD5Ff2F83c7a84E85c40fA2f53Fc1Dd8495E33502"]
    },
    DiamondInit: { address: "0x851067263EF0763c51eDABA7E01B4d09C65856AA" },
    DiamondCutFacet: { address: "0xD5Ff2F83c7a84E85c40fA2f53Fc1Dd8495E33502" },
    DiamondLoupeFacet: { address: "0x888ADa8C9FD8d7DA636b764cafcCFDf9c277A46F" },
    AdminPauseFacet: { address: "0x142dF15ce449f083aDf7fC74F7B6CbB4d3d775B8" },
    AdminPrivilegesFacet: { address: "0x88484E465D1eD933d3762D76276951F3FFC243fB" },
    AllowlistFacet: { address: "0x4bC5cd1C7B868baC45A79637E8a407d176F78269" },
    ERC165Facet: { address: "0xBbcFE667c443C475a5F0bB4E4Fb8Aaa14EE75E29" },
    RoyaltiesConfigFacet: { address: "0x1832022d2873FA913391091F0ca4d03e68dC3335" },
    PaymentSplitterFacet: { address: "0xcBb3A65715837Ef37bCCAa8279e101dF92Ef8D29" },
    TokenFacet: { address: "0x2C3fd62BD75A148eba7c6C12b2FB19B475a012EE" }
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