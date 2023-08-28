const logErrors = false;
const contracts = { // Goerli
    Diamond: {
        address: "",
        arguments: [""]
    },
    DiamondInit: { address: "" },
    DiamondCutFacet: { address: "" },
    DiamondLoupeFacet: { address: "" },
    AdminPauseFacet: { address: "" },
    AdminPrivilegesFacet: { address: "" },
    AllowlistFacet: { address: "" },
    ERC165Facet: { address: "" },
    RoyaltiesConfigFacet: { address: "" },
    PaymentSplitterFacet: { address: "" },
    TokenFacet: { address: "" }
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