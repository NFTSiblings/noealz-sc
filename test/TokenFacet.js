const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect, assert } = require("chai")

beforeEach(async () => {
    [deployer, addr1] = await ethers.getSigners()
    diamondAddress = await deployDiamond()
    
    AdminPauseFacet = await ethers.getContractAt('AdminPauseFacet', diamondAddress)
})

describe("TokenFacet", () => {

    describe("Admin functions", () => {

        describe("reserve", () => {

            it("Is only callable by admins", async () => {
                await expect(
                    TokenFacet.connect(addr1).reserve(1, addr1.address)
                ).to.be.revertedWith("GlobalState: caller is not admin or owner")
            })
    
            it("Mints correct amount of tokens to correct address", async () => {
                await TokenFacet.reserve(1, deployer.address)

                expect(await TokenFacet.ownerOf(0))
                .to.equal(deployer.address)

                expect(await TokenFacet.exists(1)).to.equal(false)
            })

        })

        // describe("recover", () => {

        //     it("Is only callable by admins", async () => {
        //         await TokenFacet.reserve(1, addr1.address)
    
        //         await expect(TokenFacet.connect(addr1).recover(0, deployer.address))
        //         .to.be.revertedWith("GlobalState: caller is not admin or owner")
        //     })
    
        //     it("Transfers the specified token to the specified address", async () => {
        //         await TokenFacet.reserve(1, addr1.address)
    
        //         await expect(TokenFacet.recover(0, deployer.address))
        //         .not.to.be.reverted
    
        //         expect(await TokenFacet.ownerOf(0))
        //         .to.equal(deployer.address)
        //     })
    
        // })

    })

    describe("Setter functions", () => {

        describe("toggleBurnStatus", () => {

            it("Is only callable by admins", async () => {
                await expect(
                    TokenFacet.connect(addr1).toggleBurnStatus()
                ).to.be.revertedWith("GlobalState: caller is not admin or owner")
            })
    
            it("Correctly updates the state", async () => {
                expect(await TokenFacet.burnStatus())
                .to.equal(false)

                await TokenFacet.toggleBurnStatus()

                expect(await TokenFacet.burnStatus())
                .to.equal(true)
            })

        })

        describe("setBaseURI", () => {

            it("Is only callable by admins", async () => {
                await expect(
                    TokenFacet.connect(addr1).setBaseURI("")
                ).to.be.revertedWith("GlobalState: caller is not admin or owner")
            })
    
            it("Correctly updates the state", async () => {
                await TokenFacet.reserve(1, deployer.address)

                expect((await TokenFacet.tokenURI(0)).substring(0, 27))
                .not.to.equal("new-uri/0")

                await TokenFacet.setBaseURI("new-uri/")

                expect((await TokenFacet.tokenURI(0)).substring(0, 27))
                .to.equal("new-uri/0")
            })

        })

        describe("setName", () => {
            it("Is only callable by admins", async () => {
                await expect(
                    TokenFacet.connect(addr1).setName("someName")
                ).to.be.revertedWith("GlobalState: caller is not admin or owner")
            })
    
            it("Correctly updates the state", async () => {
                let newName = "someName"
                expect(await TokenFacet.name()).not.to.equal(newName)
                await TokenFacet.setName(newName)
                expect(await TokenFacet.name()).to.equal(newName)
            })
        })

        describe("setSymbol", () => {
            it("Is only callable by admins", async () => {
                await expect(
                    TokenFacet.connect(addr1).setSymbol("SOMESYMBOL")
                ).to.be.revertedWith("GlobalState: caller is not admin or owner")
            })
    
            it("Correctly updates the state", async () => {
                let newSymbol = "SOMESYMBOL"
                expect(await TokenFacet.symbol()).not.to.equal(newSymbol)
                await TokenFacet.setSymbol(newSymbol)
                expect(await TokenFacet.symbol()).to.equal(newSymbol)
            })
        })

    })

})