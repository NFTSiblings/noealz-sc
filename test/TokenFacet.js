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

        describe("setImage", () => {

            beforeEach(async () => {

                DAY_TAG = '<DAY>'
                CITY_TAG = '<CITY>'

                image = [
                    'data:application/json;utf8,{"name":"Moments #',
                    DAY_TAG,
                    '","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri.url/',
                    DAY_TAG,
                    '","image_url":"https://newuri.url/',
                    DAY_TAG,
                    '","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"',
                    CITY_TAG,
                    '"}]}'
                ]

            })

            it("Is only callable by admins", async () => {

                await expect(TokenFacet.connect(addr1).setImage(image))
                .to.be.revertedWith("GlobalState: caller is not admin or owner")

            })

            it("Correctly updates the state", async () => {

                expect(await TokenFacet.getImage()).not.to.equal(image)
                expect(await TokenFacet.connect(deployer).setImage(image))
                .to.be.not.reverted
                expect(await TokenFacet.getImage()).to.be.deep.equal(image)

            })

        })

        describe("setDayToCity", () => {

            beforeEach(async () => {

                cities = ["Hong Kong", "Seoul", "Tokyo", "Delhi"]
                city366 = []
                days366 = []

                for(let i = 0; i < 367; i++) {
                    city366[i] = cities[i % 4]
                    days366[i] = i
                }
                
            })

            it("Is only callable by admins", async () => {

                await expect(TokenFacet.connect(addr1).setDayToCity(days366, city366))
                .to.be.revertedWith("GlobalState: caller is not admin or owner")

            })

            it("Reverts when input is not proper", async () => {

                days366.push(367)
                await expect(TokenFacet.connect(deployer).setDayToCity(days366, city366))
                .to.be.revertedWith("improper input")

            })

            it("Correctly updates the state", async () => {

                for(let i = 0; i < 367; i++) {
                    expect(await TokenFacet.getDayToCity(days366[i])).to.be.equal("")
                }

                expect(await TokenFacet.connect(deployer).setDayToCity(days366, city366))
                .to.be.not.reverted

                for(let i = 0; i < 367; i++) {
                    expect(await TokenFacet.getDayToCity(days366[i])).to.be.equal(city366[i])
                }
                
            })

        })

    })

    describe("Metadata and Misc Functions", () => {

        describe("tokenURI(uint256)", () => {

            beforeEach(async () => {

                breakPoints = [1, 11, 366]
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
                    
                tokenIds = [0, 1, 2, 3, 4]
                freezenTokenIds = [5, 6, 7]
                SECOND_IN_A_DAY = 86400
                allNumbers0 = array()
                allNumbers1 = array()
                allNumbers2 = array()
                allNumbers3 = array()
                allNumbers4 = array()
                saleTimestamp = await SaleHandlerFacet.saleTimestamp()
                cities = ["Hong Kong", "Seoul", "Tokyo", "Delhi"]
                city366 = []
                days366 = []

                for(let i = 0; i < 367; i++) {
                    city366[i] = cities[i % 4]
                    days366[i] = i
                }

                await SaleHandlerFacet.beginPrivSale()
                await TokenFacet.setBreakPoints(breakPoints)
                await TokenFacet.reserve(8, deployer.address)
                await TokenFacet.setDayToCity(days366, city366)

            })

            it("Before sales start", async () => {

                let currentTime = await helpers.time.latest()
                if(currentTime > saleTimestamp) await SaleHandlerFacet.setSaleTimestamp(ethers.BigNumber.from(await helpers.time.latest()).add(100))
                let currentDay = 0
                let currentCity = city366[currentDay]
                let metadata = `data:application/json;utf8,{"name":"Moments #${currentDay}","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri/${currentDay}","image_url":"https://newuri/${currentDay}","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"${currentCity}"}]}`
                expect(await TokenFacet.tokenURI(tokenIds[0])).to.be.equal(metadata)

            })

            it("First 10 days uri works as intended", async () => {

                let currentTime = await helpers.time.latest()
                if(currentTime < saleTimestamp)await helpers.time.increaseTo(saleTimestamp)

                let frozenMetadata = await TokenFacet.tokenURI(freezenTokenIds[0])
                await TokenFacet.freeze(freezenTokenIds[0])

                for(let i = breakPoints[0]; i < breakPoints[1]; i++) {

                    for(let j = 0; j < 5; j++) {

                        let currentDay = i
                        let currentCity = city366[currentDay]
                        let metadata = `data:application/json;utf8,{"name":"Moments #${currentDay}","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri/${currentDay}","image_url":"https://newuri/${currentDay}","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"${currentCity}"}]}`
                        expect(await TokenFacet.tokenURI(tokenIds[j])).to.be.equal(metadata)

                    }

                    expect(await TokenFacet.tokenURI(freezenTokenIds[0])).to.be.equal(frozenMetadata)
                
                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

            })

            it("All Other Days are randomly distributed over the year", async () => {

                let frozenMetadata = await TokenFacet.tokenURI(freezenTokenIds[1])
                await TokenFacet.freeze(freezenTokenIds[1])

                for(let i = breakPoints[1]; i < breakPoints[2]; i++) {

                    for(let j = 0; j < 5; j++) {

                        let currentDay = parseInt((await TokenFacet.tokenURI(j)).substring(45, 48))
                        let currentCity = city366[currentDay]
                        let metadata = `data:application/json;utf8,{"name":"Moments #${currentDay}","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri/${currentDay}","image_url":"https://newuri/${currentDay}","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"${currentCity}"}]}`
                        expect(await TokenFacet.tokenURI(tokenIds[j])).to.be.equal(metadata)

                        let dayArray = pickArray(j)
                        expect(dayArray.includes(currentDay)).to.be.equal(true)
                        removeSpecificItem(dayArray, currentDay)
                        expect(dayArray.length).to.be.equal(arrayLength - ((i - breakPoints[1]) + 1))

                    }

                    expect(await TokenFacet.tokenURI(freezenTokenIds[1])).to.be.equal(frozenMetadata)

                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

                expect(allNumbers0.length).to.be.equal(0)
                expect(allNumbers1.length).to.be.equal(0)
                expect(allNumbers2.length).to.be.equal(0)
                expect(allNumbers3.length).to.be.equal(0)
                expect(allNumbers4.length).to.be.equal(0)

            })

            it("Sets to default URI after 1 year", async () => {

                let frozenMetadata = await TokenFacet.tokenURI(freezenTokenIds[2])
                await TokenFacet.freeze(freezenTokenIds[2])

                for(let i = 0; i < 365; i++) {

                    for(let j = 0; j < 5; j++) {

                        let currentDay = 366
                        let currentCity = city366[currentDay]
                        let metadata = `data:application/json;utf8,{"name":"Moments #${currentDay}","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri/${currentDay}","image_url":"https://newuri/${currentDay}","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"${currentCity}"}]}`
                        expect(await TokenFacet.tokenURI(tokenIds[j])).to.be.equal(metadata)

                    }

                    expect(await TokenFacet.tokenURI(freezenTokenIds[2])).to.be.equal(frozenMetadata)
                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

            })

        })

    })

    describe("Public Function", () => {

        describe("freeze", () => {

            beforeEach(async () => {

                breakPoints = [0, 11, 366]
                arrayLength = breakPoints[2] - breakPoints[1]

                tokenIds = [0, 1, 2]
                SECOND_IN_A_DAY = 86400
                saleTimestamp = await SaleHandlerFacet.saleTimestamp()
                cities = ["Hong Kong", "Seoul", "Tokyo", "Delhi"]
                city366 = []
                days366 = []

                for(let i = 0; i < 367; i++) {
                    city366[i] = cities[i % 4]
                    days366[i] = i
                }

                await TokenFacet.setBreakPoints(breakPoints)
                await TokenFacet.reserve(3, deployer.address)
                await TokenFacet.setDayToCity(days366, city366)

            })

            it("Reverts if sender is not owner", async() => {

                let currentTime = await helpers.time.latest()
                if(currentTime < saleTimestamp)await helpers.time.increaseTo(saleTimestamp)

                await expect(TokenFacet.connect(addr1).freeze(tokenIds[0]))
                .to.be.revertedWith("Only owners can freeze URI")

            })

            it("TokenURI is frozen as intended", async () => {

                let currentTime = await helpers.time.latest()
                if(currentTime < saleTimestamp)await helpers.time.increaseTo(saleTimestamp)
                
                let frozenMetadata1 = await TokenFacet.tokenURI(tokenIds[0])

                await expect(TokenFacet.freeze(tokenIds[0]))
                .to.be.not.reverted

                for(let i = breakPoints[0]; i < breakPoints[1]; i++) {

                    expect(await TokenFacet.tokenURI(tokenIds[0])).to.be.equal(frozenMetadata1)
                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

                let frozenMetadata2 = await TokenFacet.tokenURI(tokenIds[1])

                await expect(TokenFacet.freeze(tokenIds[1]))
                .to.be.not.reverted

                for(let i = breakPoints[1]; i < breakPoints[2]; i++) {

                    expect(await TokenFacet.tokenURI(tokenIds[0])).to.be.equal(frozenMetadata1)
                    expect(await TokenFacet.tokenURI(tokenIds[1])).to.be.equal(frozenMetadata2)
                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

                let frozenMetadata3 = await TokenFacet.tokenURI(tokenIds[2])

                await expect(TokenFacet.freeze(tokenIds[2]))
                .to.be.not.reverted

                for(let i = 1; i < 365; i++) {

                    expect(await TokenFacet.tokenURI(tokenIds[0])).to.be.equal(frozenMetadata1)
                    expect(await TokenFacet.tokenURI(tokenIds[1])).to.be.equal(frozenMetadata2)
                    expect(await TokenFacet.tokenURI(tokenIds[2])).to.be.equal(frozenMetadata3)
                    await helpers.time.increase(SECOND_IN_A_DAY)

                }

            })

            it("Reverts if token is already frozen", async () => {

                let currentTime = await helpers.time.latest()
                if(currentTime < saleTimestamp)await helpers.time.increaseTo(saleTimestamp)

                await TokenFacet.freeze(tokenIds[0])

                await expect(TokenFacet.freeze(tokenIds[0]))
                .to.be.revertedWith("URI already frozen for tokenId")

            })

        })

    })

})