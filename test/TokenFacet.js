const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")

beforeEach(async () => {
    [deployer, addr1] = await ethers.getSigners()
    diamondAddress = await deployDiamond()
    
    AdminPauseFacet = await ethers.getContractAt('AdminPauseFacet', diamondAddress)
    TokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
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

        describe("setBreakPoints", async () => {

            beforeEach(async () => {

                breakPoints = [0, 5, 360]

            })

            it("Is only callable by admins", async () => {

                await expect(TokenFacet.connect(addr1).setBreakPoints(breakPoints))
                .to.be.revertedWith("GlobalState: caller is not admin or owner")

            })

            it("Correctly updates the state", async () => {

                expect(await TokenFacet.getBreakPoints()).not.to.equal(breakPoints)
                expect(await TokenFacet.connect(deployer).setBreakPoints(breakPoints))
                .to.be.not.reverted
                expect(await TokenFacet.getBreakPoints()).to.be.deep.equal(breakPoints)

            })

        })

    })

    describe("Metadata and Misc Functions", () => {

        describe("tokenURI(uint256)", () => {

            beforeEach(async () => {

                breakPoints = [0, 11, 366]
                arrayLength = breakPoints[2] - breakPoints[1]

                array = () => {
                    final = []
                    for(i = breakPoints[1]; i < breakPoints[2]; i++){
                        final.push(i)
                    }
                    return final
                }
                pickArray = (i) => {
                    if (i == 0) return allNumbers0
                    else if (i == 1) return allNumbers1
                    else if (i == 2) return allNumbers2
                    else if (i == 3) return allNumbers3
                    else if (i == 4) return allNumbers4
                }
                removeSpecificItem = (array, item) => {
                    position = 0
                    for(i = 0; i < array.length; i++) {
                        if(array[i] == item) {
                            position = i;
                            break;
                        }
                    }
                    array.splice(position, 1)
                    return array
                }

                tokenURI = "https://newuri/"
                tokenIds = [0, 1, 2, 3, 4]
                SECOND_IN_A_DAY = 86400
                allNumbers0 = array()
                allNumbers1 = array()
                allNumbers2 = array()
                allNumbers3 = array()
                allNumbers4 = array()
                saleTimestamp = await SaleHandlerFacet.saleTimestamp()

                await TokenFacet.setBreakPoints(breakPoints)
                await TokenFacet.reserve(5, deployer.address)
                await TokenFacet.setBaseURI(tokenURI)

            })

            it("First 10 days uri works as intended", async () => {


                await helpers.time.increaseTo(saleTimestamp)

                for(let i = 1; i < 11; i++) {

                    for(let j = 0; j < 5; j++) {
                        expect((await TokenFacet.tokenURI(tokenIds[j])).substring(15)).to.be.equal(i.toString())
                    }
                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

            })

            it("All Other Days are randomly distributed over the year", async () => {

                for(let i = breakPoints[1]; i < breakPoints[2]; i++) {

                    for(let j = 0; j < 5; j++) {

                        let currentDay = parseInt((await TokenFacet.tokenURI(j)).substring(15));
                        let dayArray = pickArray(j)
                        expect(dayArray.includes(currentDay)).to.be.equal(true)
                        removeSpecificItem(dayArray, currentDay)
                        expect(dayArray.length).to.be.equal(arrayLength - ((i - breakPoints[1]) + 1))

                    }

                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

                expect(allNumbers0.length).to.be.equal(0)
                expect(allNumbers1.length).to.be.equal(0)
                expect(allNumbers2.length).to.be.equal(0)
                expect(allNumbers3.length).to.be.equal(0)
                expect(allNumbers4.length).to.be.equal(0)

            })

            it("Sets to default URI after 1 year", async () => {

                for(let i = 0; i < 365; i++) {

                    for(let j = 0; j < 5; j++) {

                        expect((await TokenFacet.tokenURI(tokenIds[j])).substring(15)).to.be.equal("366")
                    }

                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

            })

        })

    })

})