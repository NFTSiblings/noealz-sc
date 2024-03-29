const { deployDiamond } = require('../scripts/diamondFullDeployment.js')
const { expect, assert } = require("chai")
const { ethers } = require("hardhat")

beforeEach(async () => {
    [deployer] = await ethers.getSigners()
    diamondAddress = await deployDiamond()

    DiamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    AdminPrivilegesFacet = await ethers.getContractAt('AdminPrivilegesFacet', diamondAddress)
    AllowlistFacet = await ethers.getContractAt('AllowlistFacet', diamondAddress)
    TokenFacet = await ethers.getContractAt('TokenFacet', diamondAddress)
    ERC165Facet = await ethers.getContractAt('ERC165Facet', diamondAddress)
    PaymentSplitterFacet = await ethers.getContractAt('PaymentSplitterFacet', diamondAddress)
    RoyaltiesConfigFacet = await ethers.getContractAt('RoyaltiesConfigFacet', diamondAddress)
})

describe("Diamond Deployment", () => {
    it("Correctly sets the contract owner", async () => {
        expect(await AdminPrivilegesFacet.owner()).to.equal(deployer.address)
    })

    it("Correctly adds DiamondCutFacet", async () => {
        // Checking that a facet exists for the diamondCut function
        const diamondCutFunctionSelector = "0x1f931c1c"
        expect(await DiamondLoupeFacet.facetAddress(diamondCutFunctionSelector))
        .not.to.be.equal(ethers.constants.AddressZero)
    })
})

describe("Initialisation", () => {
    it("All facets are added", async () => {
        facetAddresses = []
        for (address of await DiamondLoupeFacet.facetAddresses()) {
            facetAddresses.push(address)
        }
        assert.equal(facetAddresses.length, 9)
    })

    it("AdminPrivilegesFacet is initialised correctly", async () => {
        admin = "0x885Af893004B4405Dc18af1A4147DCDCBdA62b50"
        expect(await AdminPrivilegesFacet.isAdmin(admin)).to.equal(true)
    })

    it("AllowlistFacet is initialised correctly", async () => {
        merkleRoot = "0x3d7ea9207f8fd37c25e5eebfea71390f9fefee8c47f9b9a5c390cdee08df7ba2"
        expect(await AllowlistFacet.merkleRoot()).to.equal(merkleRoot)
    })

    it("TokenFacet is initialised correctly", async () => {
        baseURI = "https://bafybeific3erby3nlhhc7ngrarpvrps7lomgkqfwnlmbhshir2qisjox6y.ipfs.nftstorage.link/"
        preRevealURI = "ipfs://bafybeifucwd44wlg7ewt3pjwbtmytpsrshans5agistj6ikgbr5mzxj4dy/prereveal.png"
        postRevealURI = "https://bafybeiekwyjufrujp4t34sqdkg4zowylqfniww3iq5ec6h3z7qikfqzxta.ipfs.nftstorage.link/"
        breakPoints = [0, 11, 366]
        prices = [ethers.utils.parseEther("0.03"), ethers.utils.parseEther("0.0365")]
        contractName = "MomentsAsia365"
        contractSymbol = "MA365"
        startTokenId = 0
        startTimeStamp = 1680387146
        endTimeStamp = 1680473546
        unitDuration = 86400
        city = [
            "Seoul",
            "Incheon",
            "Suwon",
            "Boseong",
            "Gyeongju",
            "Busan",
            "Ulsan",
            "Cheonan",
            "Suncheon",
            "Korea",
            "Osaka",
            "Kyoto",
            "Koyasan",
            "Tokyo",
            "Enoshima",
            "Japan",
            "Hong Kong",
            "Macau"
        ]
        day = [
            61,
            64,
            66,
            67,
            68,
            120,
            121,
            126,
            127,
            135,
            187,
            229,
            241,
            294,
            297,
            302,
            354,
            365
        ]

        await TokenFacet.reserve([deployer.address], [1])
        expect(await TokenFacet.exists(0)).to.equal(true)
        expect(await TokenFacet.getBreakPoints()).to.deep.equal(breakPoints)
        expect(await TokenFacet.price()).to.equal(prices[1])
        expect(await TokenFacet.priceAl()).to.equal(prices[0])
        expect(await TokenFacet.name()).to.equal(contractName)
        expect(await TokenFacet.symbol()).to.equal(contractSymbol)
        expect(await TokenFacet.startTimeStamp()).to.equal(startTimeStamp)
        expect(await TokenFacet.endTimeStamp()).to.equal(endTimeStamp)
        expect(await TokenFacet.revealTimeStamp()).to.equal(startTimeStamp)
        expect(await TokenFacet.unitDuration()).to.equal(unitDuration)

        for(let i = 0; i < 365; i++) {
            if(i <= day[0]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[0])
            }
            else if(i <= day[1]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[1])
            }
            else if(i <= day[2]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[2])
            }
            else if(i <= day[3]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[3])
            }
            else if(i <= day[4]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[4])
            }
            else if(i <= day[5]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[5])
            }
            else if(i <= day[6]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[6])
            }
            else if(i <= day[7]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[7])
            }
            else if(i <= day[8]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[8])
            }
            else if(i <= day[9]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[9])
            }
            else if(i <= day[10]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[10])
            }
            else if(i <= day[11]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[11])
            }
            else if(i <= day[12]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[12])
            }
            else if(i <= day[13]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[13])
            }
            else if(i <= day[14]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[14])
            }
            else if(i <= day[15]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[15])
            }
            else if(i <= day[16]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[16])
            }
            else if(i <= day[17]) {
                expect(await TokenFacet.getDayToCity(i)).to.equal(city[17])
            }

        }
    })

    it("ERC165Facet is initialised correctly", async () => {
        interfaceIds = ["0x01ffc9a7", "0x7f5828d0", "0x2a55205a", "0x80ac58cd", "0x5b5e139f", "0x48e2b093", "0x1f931c1c"]

        for (id of interfaceIds) {
            expect(await ERC165Facet.supportsInterface(id)).to.equal(true);
        }
    })

    it("PaymentSplitterFacet is initialised correctly", async () => {
        shareholder = "0x699a1928EA12D21dd2138F36A3690059bf1253A0"

        expect(await PaymentSplitterFacet.totalShares()).to.equal(1)
        expect(await PaymentSplitterFacet.payee(0)).to.equal(shareholder)
        expect(await PaymentSplitterFacet.shares(shareholder)).to.equal(1)
    })

    it("RoyaltiesConfigFacet is initialised correctly", async () => {
        royaltyRecipient = "0x699a1928EA12D21dd2138F36A3690059bf1253A0"
        royaltyBps = 1000

        let recipient
        [recipient, fee] = await RoyaltiesConfigFacet.royaltyInfo(0, ethers.utils.parseEther("1"))

        expect(recipient).to.equal(royaltyRecipient)
        expect(fee).to.equal(ethers.utils.parseEther("1").mul(royaltyBps).div(10000))
    })
})