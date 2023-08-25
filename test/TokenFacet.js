const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")

beforeEach(async () => {
    [deployer, addr1, addr2] = await ethers.getSigners()
    diamondAddress = await deployDiamond()
    
    AdminPauseFacet = await ethers.getContractAt('AdminPauseFacet', diamondAddress)
    AllowlistFacet = await ethers.getContractAt('AllowlistFacet', diamondAddress)
    TokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
})

describe("TokenFacet", () => {

    describe("Admin functions", () => {

        describe("reserve", () => {

            beforeEach(async () => {

                address = [deployer.address, addr1.address]
                amount = [2, 3]

            })

            it("Is only callable by admins", async () => {
                await expect(
                    TokenFacet.connect(addr1).reserve(address, amount)
                ).to.be.revertedWith("GlobalState: caller is not admin or owner")
            })
    
            it("Mints correct amount of tokens to correct address", async () => {
                await TokenFacet.connect(deployer).reserve(address, amount)

                expect(await TokenFacet.ownerOf(0))
                .to.equal(deployer.address)
                expect(await TokenFacet.ownerOf(1))
                .to.equal(deployer.address)
                expect(await TokenFacet.ownerOf(2))
                .to.equal(addr1.address)
                expect(await TokenFacet.ownerOf(3))
                .to.equal(addr1.address)
                expect(await TokenFacet.ownerOf(4))
                .to.equal(addr1.address)

                expect(await TokenFacet.exists(0)).to.equal(true)
                expect(await TokenFacet.exists(1)).to.equal(true)
                expect(await TokenFacet.exists(2)).to.equal(true)
                expect(await TokenFacet.exists(3)).to.equal(true)
                expect(await TokenFacet.exists(4)).to.equal(true)
            })

        })

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
                cities = ["Hong Kong", "Seoul", "Tokyo", "Delhi"]
                city366 = []
                days366 = []

                for(let i = 0; i < 367; i++) {
                    city366[i] = cities[i % 4]
                    days366[i] = i
                }

                await TokenFacet.setBreakPoints(breakPoints)
                await TokenFacet.reserve([deployer.address], [8])
                await TokenFacet.setDayToCity(days366, city366)

            })

            it("Before sales start", async () => {

                await TokenFacet.startSale(ethers.BigNumber.from(await helpers.time.latest()).add(100))

                let currentDay = 0
                let currentCity = city366[currentDay]
                let metadata = `data:application/json;utf8,{"name":"Moments #${currentDay}","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri/${currentDay}","image_url":"https://newuri/${currentDay}","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"${currentCity}"}]}`
                expect(await TokenFacet.tokenURI(tokenIds[0])).to.be.equal(metadata)

            })

            it("First 10 days uri works as intended", async () => {

                await TokenFacet.startSale(0)
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

                await TokenFacet.startSale(0)
                await helpers.time.increase(SECOND_IN_A_DAY * 10)

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
                saleTimestamp = await TokenFacet.startTimeStamp()
                cities = ["Hong Kong", "Seoul", "Tokyo", "Delhi"]
                city366 = []
                days366 = []

                for(let i = 0; i < 367; i++) {
                    city366[i] = cities[i % 4]
                    days366[i] = i
                }

                await TokenFacet.setBreakPoints(breakPoints)
                await TokenFacet.reserve([deployer.address], [3])
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

        describe("mint", async () => {

            beforeEach(async () => {

                rootHash = "0xcf1b6561beae041667a729b31fd5f3010c89b48e6594f13f046ba6e947d4a819"
                addr1Proof = [
                    '0xb33aa8fddc2ef6ab608eb0d847b0c7638946d98838cd3c5e229f1a9f9d68f527',
                    '0x8a3552d60a98e0ade765adddad0a2e420ca9b1eef5f326ba7ab860bb4ea72c94',
                    '0x7e62b0339f031def596d617b91dc1cba6d6dd8fe26c6d2c1dd68f6565c709c9b'
                ]
                await AllowlistFacet.connect(deployer).setMerkleRoot(rootHash)
                amountToMint = 2
                price = ethers.BigNumber.from(await TokenFacet.price()).mul(amountToMint)
                priceAl = ethers.BigNumber.from(await TokenFacet.priceAl()).mul(amountToMint)

            })

            it("reverted when sale is closed", async () => {

                await TokenFacet.stopSale(0)
                expect(await TokenFacet.isSaleOpen()).to.equal(false)

                await expect(TokenFacet.connect(addr1).mint(amountToMint, addr1Proof), {value: priceAl})
                .to.be.revertedWith("TokenFacet: token sale is not available now")

            })

            it("reverted for wrong merkleproof", async () => {

                await TokenFacet.startSale(0)
                await TokenFacet.stopSale(ethers.BigNumber.from(await helpers.time.latest()).add(1000))
                expect(await TokenFacet.isSaleOpen()).to.equal(true)

                await expect(TokenFacet.connect(addr2).mint(amountToMint, addr1Proof, {value: priceAl}))
                .to.be.revertedWith("AllowlistFacet: invalid merkle proof")

            })

            it("revert for incorrect amount", async () =>{

                await TokenFacet.startSale(0)
                await TokenFacet.stopSale(ethers.BigNumber.from(await helpers.time.latest()).add(1000))
                expect(await TokenFacet.isSaleOpen()).to.equal(true)

                await expect(TokenFacet.connect(addr1).mint(amountToMint, [], {value: priceAl}))
                .to.be.revertedWith("TokenFacet: incorrect amount of ether sent")

            })

            it("non-allowlist sale", async () => {

                await TokenFacet.startSale(0)
                await TokenFacet.stopSale(ethers.BigNumber.from(await helpers.time.latest()).add(1000))
                expect(await TokenFacet.isSaleOpen()).to.equal(true)

                await expect(TokenFacet.connect(addr1).mint(amountToMint, addr1Proof, {value: priceAl}))
                .to.changeEtherBalances([addr1.address, diamondAddress], [-priceAl, priceAl])

            })

            it("allowlist sale", async () => {

                await TokenFacet.startSale(0)
                await TokenFacet.stopSale(ethers.BigNumber.from(await helpers.time.latest()).add(1000))
                expect(await TokenFacet.isSaleOpen()).to.equal(true)

                await expect(TokenFacet.connect(addr2).mint(amountToMint, [], {value: price}))
                .to.changeEtherBalances([addr2.address, diamondAddress], [-price, price])

            })

        })

    })

})