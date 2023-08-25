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
        uint256 startTimeStamp;
        uint256 endTimeStamp;
        uint256 globalRandom;
        uint256[] breakPoints;
        uint256[] price;
        string[] image;
        bool burnStatus;

        mapping (uint256 => string) dayToCity;
        mapping (uint256 => uint256) frozen;
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
import { AllowlistLib } from "./AllowlistFacet.sol";

import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';

contract TokenFacet is ERC721AUpgradeable {

    // MODIFIERS //__ERC721A_init

    modifier onlyAdmins {
        GlobalState.requireCallerIsAdmin();
        _;
    }

    modifier contractNotPause {
        GlobalState.requireContractIsNotPaused();
        _;
    }

    // VARIABLE GETTERS //
    
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

    function startTimeStamp() external view returns (uint256) {
        return TokenFacetLib.getState().startTimeStamp;
    }

    function endTimeStamp() external view returns (uint256) {
        return TokenFacetLib.getState().endTimeStamp;
    }

    function priceAl() external view returns (uint256) {
        return TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Allowlist)];
    }

    function price() external view returns (uint256) {
        return TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Public)];
    }

    function burnStatus() external view returns (bool) {
        return TokenFacetLib.getState().burnStatus;
    }

    function isSaleOpen() public view returns (bool) {
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        if(s.startTimeStamp == 0) return false;
        else {
            if(s.endTimeStamp == 0) {
                return block.timestamp >= s.startTimeStamp;
            }
            else {
                return
                    block.timestamp >= s.startTimeStamp &&
                    block.timestamp < s.endTimeStamp;
            }
        }
    }

    // SETUP & ADMIN FUNCTIONS //

    function setBreakPoints(uint256[] memory breakPoints) external onlyAdmins {
        require(breakPoints.length == 3, "Improper Input");
        TokenFacetLib.getState().breakPoints = breakPoints;
    }

    function setPrices(uint256 _price, uint256 _priceAL) external onlyAdmins {
        TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Allowlist)] = _priceAL;
        TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Public)] = _price;
    }

    function setName(string memory name) external onlyAdmins {
        ERC721AStorage.layout()._name = name;
    }

    function setSymbol(string memory symbol) external onlyAdmins {
        ERC721AStorage.layout()._symbol = symbol;
    }

    function setImage(string[] memory image) external onlyAdmins {
        TokenFacetLib.getState().image = image;
    }

    function toggleBurnStatus() external onlyAdmins {
        TokenFacetLib.getState().burnStatus = !TokenFacetLib.getState().burnStatus;
    }

    function startSale(uint256 startTimeStamp) external onlyAdmins {
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        startTimeStamp == 0 ? s.startTimeStamp = block.timestamp : s.startTimeStamp = startTimeStamp;
    }

    function stopSale(uint256 endTimeStamp) external onlyAdmins {
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        endTimeStamp == 0 ? s.endTimeStamp = block.timestamp : s.endTimeStamp = endTimeStamp;
    }

    function setDayToCity(uint256[] memory day, string[] memory city) external onlyAdmins {
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

    function reserve(address[] memory recipient, uint256[] memory amount) external onlyAdmins {
        require(
            recipient.length == amount.length,
            "TokenFacet: invalid inputs"
        );
        GlobalState.requireCallerIsAdmin();
        for(uint256 i; i < recipient.length;) {
            _safeMint(recipient[i], amount[i]);
            unchecked{
                i++;
            }
        }
    }

    // PUBLIC FUNCTIONS //

    function mint(uint256 amount, bytes32[] calldata _merkleProof) external payable contractNotPause {
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        require(isSaleOpen(), "TokenFacet: token sale is not available now");

        bool al = _merkleProof.length != 0;
        if(al) {
            AllowlistLib.requireValidProof(_merkleProof);
        }

        uint256 _price = al ? s.price[uint256(TokenFacetLib.PriceType.Allowlist)] : s.price[uint256(TokenFacetLib.PriceType.Public)];
        require(msg.value == _price * amount, "TokenFacet: incorrect amount of ether sent");

        _safeMint(msg.sender, amount);
    }

    function burn(uint256 tokenId) external contractNotPause {
        require(TokenFacetLib.getState().burnStatus, "TokenFacet: token burning is not available now");

        _burn(tokenId, true);
    }

    function freeze(uint256 tokenId) external contractNotPause {
        TokenFacetLib.state storage s = TokenFacetLib.getState();

        require(s.frozen[tokenId] == 0, "URI already frozen for tokenId");
        require(ownerOf(tokenId) == msg.sender, "Only owners can freeze URI");

        uint256 saleTimestamp = s.startTimeStamp;
        require(saleTimestamp != 0, "TokenFacet: cannot freeze uri before sale has started");
        uint256 DAY_NUMBER = ((block.timestamp - saleTimestamp) / 1 days) + 1;
        
        s.frozen[tokenId] = DAY_NUMBER;
    }

    // METADATA & MISC FUNCTIONS //

    function tokenURI(uint256 tokenId) public override view returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        uint256 saleTimestamp = s.startTimeStamp;
        uint256 frozen = uint256(s.frozen[uint256(tokenId)]);
        
        if(block.timestamp >= saleTimestamp && saleTimestamp != 0) {
                uint256 DAY_NUMBER;
                if(frozen != 0) DAY_NUMBER = frozen;
                else DAY_NUMBER = ((block.timestamp - saleTimestamp) / 1 days) + 1;
                uint256[] memory breakPoints = s.breakPoints;
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

    // INTERNAL FUNCTIONS //

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