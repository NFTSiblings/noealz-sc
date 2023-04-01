// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**************************************************************\
 * TokenFacetLib authored by Sibling Labs
 * Version 0.3.0
 * 
 * This library is designed to work in conjunction with
 * TokenFacet - it facilitates diamond storage and shared
 * functionality associated with TokenFacet.
/**************************************************************/

import "erc721a-upgradeable/contracts/ERC721AStorage.sol";

library TokenFacetLib {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("tokenfacet.storage");

    string internal constant DAY_TAG = '<DAY>';
    string internal constant CITY_TAG = '<CITY>';

    enum PriceType { Allowlist, Public }
    enum WalletCapType { Allowlist, Public }


    struct state {
        uint256 globalRandom;
        uint256 maxSupply;
        uint256[] breakPoints;
        uint256[] walletCap;
        uint256[] price;
        string[] image;
        bool burnStatus;

        mapping (uint256 => string) dayToCity;
        mapping(uint256 => uint256) frozen;
    }

    /**
    * @dev Return stored state struct.
    */
    function getState() internal pure returns (state storage _state) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            _state.slot := position
        }
    }

    function random(uint256 randomizer, uint256 max) internal view returns (uint256) {
        return uint256(
            keccak256(
                abi.encodePacked(
                    getState().globalRandom, randomizer, max
                )
            )
        ) % max;
    }

    function getCity(uint256 day) internal view returns (string memory) {
        return getState().dayToCity[day];
    }

    function checkTag(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b)));
    }

    function initImage() internal {
        string[] storage s = TokenFacetLib.getState().image;

        s.push('data:application/json;utf8,{"name":"Moments #');
        s.push(DAY_TAG);
        s.push('","created_by":"Noelz","description":"Different Photos everyday","image":"https://newuri/');
        s.push(DAY_TAG);
        s.push('","image_url":"https://newuri/');
        s.push(DAY_TAG);
        s.push('","image_details":{"width":2160,"height":2160,"format":"PNG"},"attributes": [{"trait_type":"City","value":"');
        s.push(CITY_TAG);
        s.push('"}]}');
    }
}

/**************************************************************\
 * TokenFacet authored by Sibling Labs
 * Version 0.6.0
 * 
 * This facet contract has been written specifically for
 * ERC721A-DIAMOND-TEMPLATE by Sibling Labs
/**************************************************************/

import { GlobalState } from "../libraries/GlobalState.sol";
import { SaleHandlerLib } from "./SaleHandlerFacet.sol";
import { AllowlistLib } from "./AllowlistFacet.sol";

import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';

contract TokenFacet is ERC721AUpgradeable {

    // VARIABLE GETTERS //

    function maxSupply() external view returns (uint256) {
        return TokenFacetLib.getState().maxSupply;
    }
    
    // Next three functions are for testing, not sure if they are required in production
    function getBreakPoints() external view returns (uint256[] memory) {
        return TokenFacetLib.getState().breakPoints;
    }

    function getImage() external view returns (string[] memory) {
        return TokenFacetLib.getState().image;
    }

    function getDayToCity(uint256 day) external view returns (string memory) {
        return TokenFacetLib.getState().dayToCity[day];
    }

    function walletCapAL() external view returns (uint256) {
        return TokenFacetLib.getState().walletCap[uint256(TokenFacetLib.WalletCapType.Allowlist)];
    }

    function walletCap() external view returns (uint256) {
        return TokenFacetLib.getState().walletCap[uint256(TokenFacetLib.WalletCapType.Public)];
    }

    function priceAL() external view returns (uint256) {
        return TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Allowlist)];
    }

    function price() external view returns (uint256) {
        return TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Public)];
    }

    function burnStatus() external view returns (bool) {
        return TokenFacetLib.getState().burnStatus;
    }

    // SETUP & ADMIN FUNCTIONS //

    function setPrices(uint256 _price, uint256 _priceAL) external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Allowlist)] = _priceAL;
        TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Public)] = _price;
    }

    function setBreakPoints(uint256[] memory breakPoints) external {
        GlobalState.requireCallerIsAdmin();
        require(breakPoints.length == 3, "Improper Input");
        TokenFacetLib.getState().breakPoints = breakPoints;
    }

    function setWalletCaps(uint256 _walletCap, uint256 _walletCapAL) external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().walletCap[uint256(TokenFacetLib.WalletCapType.Allowlist)] = _walletCapAL;
        TokenFacetLib.getState().walletCap[uint256(TokenFacetLib.WalletCapType.Public)] = _walletCap;
    }

    function toggleBurnStatus() external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().burnStatus = !TokenFacetLib.getState().burnStatus;
    }

    function setName(string memory name) external {
        GlobalState.requireCallerIsAdmin();
        ERC721AStorage.layout()._name = name;
    }

    function setSymbol(string memory symbol) external {
        GlobalState.requireCallerIsAdmin();
        ERC721AStorage.layout()._symbol = symbol;
    }

    function setImage(string[] memory image) external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().image = image;
    }

    function setDayToCity(uint256[] memory day, string[] memory city) external {
        GlobalState.requireCallerIsAdmin();
        require(day.length == city.length, "improper input");

        TokenFacetLib.state storage s = TokenFacetLib.getState();
        uint256 length = day.length;

        for(uint256 i; i < length;){
            s.dayToCity[day[i]] = city[i];

            unchecked {
                i++;
            }
        }
    }

    function reserve(uint256 amount, address recipient) external {
        GlobalState.requireCallerIsAdmin();
        _safeMint(recipient, amount);
    }

    // PUBLIC FUNCTIONS //

    function mint(uint256 amount, bytes32[] calldata _merkleProof) external payable {
        GlobalState.requireContractIsNotPaused();

        bool al = SaleHandlerLib.isPrivSaleActive();
        if (al)  {
            AllowlistLib.requireValidProof(_merkleProof);
        } else {
            require(
                SaleHandlerLib.isPublicSaleActive(),
                "TokenFacet: token sale is not available now"
            );
        }

        TokenFacetLib.state storage s = TokenFacetLib.getState();

        uint256 _price = al ? s.price[uint256(TokenFacetLib.PriceType.Allowlist)] : s.price[uint256(TokenFacetLib.PriceType.Public)];
        require(msg.value == _price * amount, "TokenFacet: incorrect amount of ether sent");

        uint256 _walletCap = al ? s.walletCap[uint256(TokenFacetLib.WalletCapType.Allowlist)] : s.walletCap[uint256(TokenFacetLib.WalletCapType.Public)];
        require(
            amount + _numberMinted(msg.sender) <= _walletCap || 
            _walletCap == 0,
            string(
                abi.encodePacked(
                    "TokenFacet: maximum tokens per wallet during ",
                    al ? "private" : "public",
                    " sale is ",
                    _toString(_walletCap)
                )
            )
        );

        _safeMint(msg.sender, amount);
    }

    function burn(uint256 tokenId) external {
        GlobalState.requireContractIsNotPaused();
        require(TokenFacetLib.getState().burnStatus, "TokenFacet: token burning is not available now");

        _burn(tokenId, true);
    }

    function freeze(uint256 tokenId) external {
        TokenFacetLib.state storage s = TokenFacetLib.getState();

        require(s.frozen[tokenId] == 0, "URI already frozen for tokenId");
        require(ownerOf(tokenId) == msg.sender, "Only owners can freeze URI");

        uint256 saleTimestamp = SaleHandlerLib.getState().saleTimestamp;
        uint256 DAY_NUMBER = ((block.timestamp - saleTimestamp) / 1 days) + 1;
        
        s.frozen[tokenId] = DAY_NUMBER;
    }

    // METADATA & MISC FUNCTIONS //

    function tokenURI(uint256 tokenId) public override view returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        uint256 saleTimestamp = SaleHandlerLib.getState().saleTimestamp;
        uint256 frozen = uint256(TokenFacetLib.getState().frozen[uint256(tokenId)]);
        
        if(block.timestamp >= saleTimestamp) {
                uint256 DAY_NUMBER;
                if(frozen != 0) DAY_NUMBER = frozen;
                else DAY_NUMBER = ((block.timestamp - saleTimestamp) / 1 days) + 1;
                uint256[] memory breakPoints = TokenFacetLib.getState().breakPoints;
                uint256 DEFAULT_AFTER_ONE_YEAR = breakPoints[2];

                if(DAY_NUMBER >= breakPoints[0] && DAY_NUMBER < breakPoints[1]) {
                    return generateMetadata(DAY_NUMBER);
                } else if(DAY_NUMBER >= breakPoints[1] && DAY_NUMBER < breakPoints[2]) {
                    uint256 length = breakPoints[2] - breakPoints[1];
                    uint256[] memory array = new uint256[](length);

                    for(uint256 i; i < length;) {
                        array[i] = i + breakPoints[1];
                        unchecked {
                            i++;
                        }
                    }

                    for(uint256 i = length - 1; i > 0; i--) {
                        uint256 j = TokenFacetLib.random((tokenId), i + 1);
                        (array[i], array[j]) = (array[j], array[i]);
                    }

                    uint256 currentDay = array[DAY_NUMBER - breakPoints[1]];
                    return generateMetadata(currentDay);
                } else if (DAY_NUMBER >= breakPoints[2]) {
                    return generateMetadata(DEFAULT_AFTER_ONE_YEAR);
                }
        } else {
            return generateMetadata(0);
        }
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function _safeMint(address to, uint256 amount) internal override {
        uint256 totalMinted = _totalMinted();
        uint256 _maxSupply = TokenFacetLib.getState().maxSupply;
        require(
            totalMinted + amount <= _maxSupply ||
            _maxSupply == 0,
            "TokenFacet: too few tokens remaining"
        );

        super._safeMint(to, amount);
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        GlobalState.requireContractIsNotPaused();
    }

    function generateMetadata(uint256 day) internal view returns (string memory) {
        bytes memory byteString;
        string[] memory image = TokenFacetLib.getState().image;
        uint256 length = image.length;

        for(uint256 i; i < length;) {
            if(TokenFacetLib.checkTag(image[i], TokenFacetLib.DAY_TAG)) {
               byteString = abi.encodePacked(byteString, _toString(day)); 
            }
            else if (TokenFacetLib.checkTag(image[i], TokenFacetLib.CITY_TAG)) {
               byteString = abi.encodePacked(byteString, TokenFacetLib.getCity(day));
            }
            else {
                byteString = abi.encodePacked(byteString, image[i]);
            }
            unchecked {
                i++;
            }
        }

        return string(byteString);
    }
}