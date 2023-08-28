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

    // MODIFIERS //

    /**
     * @dev modifier to restrict
     *      function to admins
     */
    modifier onlyAdmins {
        GlobalState.requireCallerIsAdmin();
        _;
    }

    /**
     * @dev modifier to restrict function
     *      execution based on boolean
     */
    modifier contractNotPause {
        GlobalState.requireContractIsNotPaused();
        _;
    }

    // VARIABLE GETTERS //
    
    /**
     * @dev Getter function for breakpoints variable
     */
    function getBreakPoints() external view returns (uint256[] memory) {
        return TokenFacetLib.getState().breakPoints;
    }
    /**
     * @dev Getter function for image variable
     */
    function getImage() external view returns (string[] memory) {
        return TokenFacetLib.getState().image;
    }
    /**
     * @dev return city for given day
     * @param day day number whose city is requested
     */
    function getDayToCity(uint256 day) external view returns (string memory) {
        return TokenFacetLib.getState().dayToCity[day];
    }

    /**
     * @dev returns startTimeStamp for the sale
     */
    function startTimeStamp() external view returns (uint256) {
        return TokenFacetLib.getState().startTimeStamp;
    }

    /**
     * @dev returns endTimeStamp for the sale
     */
    function endTimeStamp() external view returns (uint256) {
        return TokenFacetLib.getState().endTimeStamp;
    }

    /**
     * @dev returns allowlist price for sale
     */
    function priceAl() external view returns (uint256) {
        return TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Allowlist)];
    }

    /**
     * @dev returns public price for sale
     */
    function price() external view returns (uint256) {
        return TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Public)];
    }

    /**
     * @dev returns burn status for tokens
     */
    function burnStatus() external view returns (bool) {
        return TokenFacetLib.getState().burnStatus;
    }

    /**
     * @dev returns true if sale is open, otherwise false
     */
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

    /**
     * @dev admin only function to update
     *      break points
     * @param breakPoints breakpoints for generating metadata
     */
    function setBreakPoints(uint256[] memory breakPoints) external onlyAdmins {
        require(breakPoints.length == 3, "Improper Input");
        TokenFacetLib.getState().breakPoints = breakPoints;
    }

    /**
     * @dev admin only function to update prices
     * @param _price new public price to be set
     * @param _priceAL new allowlist price to be set
     */
    function setPrices(uint256 _price, uint256 _priceAL) external onlyAdmins {
        TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Allowlist)] = _priceAL;
        TokenFacetLib.getState().price[uint256(TokenFacetLib.PriceType.Public)] = _price;
    }

    /**
     * @dev admin only function to update name
     *      for the collection
     * @param name new name to be set
     */
    function setName(string memory name) external onlyAdmins {
        ERC721AStorage.layout()._name = name;
    }

    /**
     * @dev admin only function to update symbol
     *      for the collection
     * @param symbol new symbol to be set
     */
    function setSymbol(string memory symbol) external onlyAdmins {
        ERC721AStorage.layout()._symbol = symbol;
    }

    /**
     * @dev admin only function to update image array used 
     *      for generating metadata
     * @param image array of strings to construct metadata
     */
    function setImage(string[] memory image) external onlyAdmins {
        TokenFacetLib.getState().image = image;
    }

    /**
     * @dev admin only function that toggles burn status to control
     *      whether tokens can be burned or not
     */
    function toggleBurnStatus() external onlyAdmins {
        TokenFacetLib.getState().burnStatus = !TokenFacetLib.getState().burnStatus;
    }

    /**
     * @dev admins only function to set timestamp for starting sale
     * @param startTimeStamp timestamp to start sale or 0 to stop
     *                      sale now
     */
    function startSale(uint256 startTimeStamp) external onlyAdmins {
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        startTimeStamp == 0 ? s.startTimeStamp = block.timestamp : s.startTimeStamp = startTimeStamp;
    }

    /**
     * @dev admins only function to set timestamp for ending sale
     * @param endTimeStamp timestamp to end sale or 0 to stop
     *                      sale now
     */
    function stopSale(uint256 endTimeStamp) external onlyAdmins {
        TokenFacetLib.state storage s = TokenFacetLib.getState();
        endTimeStamp == 0 ? s.endTimeStamp = block.timestamp : s.endTimeStamp = endTimeStamp;
    }

    /**
     * @dev admin only function to set Day for each particular
     *      city
     * @param day array of days for which city has to be set
     * @param city array of city names which have to be set
     *              for given days in first param
     */
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

    /**
     * @dev admin-only function to mint batch mint NFTs to given
     *      list of addresses and list of amount to respective
     *      address
     * @param recipient array of addresses to be minted NFTs to
     * @param amount    array of amount of NFTs minted to addresses
     *                  first param
     */
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

    /**
     * @dev mint function intended to be directly called by users
     * @param amount number of NFTs that the user wants to purchase
     * @param _merkleProof  Send merkle proof for allowlist addresses
     *                      otherwise send empty array for public
     *                      purchase
     */
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

    /**
     * @dev calculates the currentDay for the token and returns metadata
     *      based on that
     * @param tokenId tokenId whose metadata is to be requested
     * @return string metadata of the given tokenId
     */
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
    /**
     * @dev checks whether a given tokenId exists or not
     * @param tokenId tokenId whose existance you want to check
     * @return bool returns true if given tokenId exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    // INTERNAL FUNCTIONS //

    /**
     * @dev Modifier the hook to check for pause variable
     * @param from sender
     * @param to new owner
     * @param startTokenId starting tokenId for the transfer 
     * @param quantity number of tokens to be sent
     */
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        GlobalState.requireContractIsNotPaused();
    }


    /**
     * @dev Used to generate metadata for the given day
     * @param day day whose metadata has to be generated
     */
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