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

    struct state {
        uint256 globalRandom;
        uint256 maxSupply;
        uint256[] breakPoints;
        uint256[] walletCap;
        uint256[] price;
        string baseURI;
        bool burnStatus;
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
    
    function getBreakPoints() external view returns (uint256[] memory) {
        return TokenFacetLib.getState().breakPoints;
    }

    function walletCapAL() external view returns (uint256) {
        return TokenFacetLib.getState().walletCap[0];
    }

    function walletCap() external view returns (uint256) {
        return TokenFacetLib.getState().walletCap[1];
    }

    function priceAL() external view returns (uint256) {
        return TokenFacetLib.getState().price[0];
    }

    function price() external view returns (uint256) {
        return TokenFacetLib.getState().price[1];
    }

    function burnStatus() external view returns (bool) {
        return TokenFacetLib.getState().burnStatus;
    }

    // SETUP & ADMIN FUNCTIONS //

    function setPrices(uint256 _price, uint256 _priceAL) external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().price[0] = _priceAL;
        TokenFacetLib.getState().price[1] = _price;
    }

    function setBreakPoints(uint256[] memory breakPoints) external {
        GlobalState.requireCallerIsAdmin();
        require(breakPoints.length == 3, "Improper Input");
        TokenFacetLib.getState().breakPoints = breakPoints;
    }

    function setWalletCaps(uint256 _walletCap, uint256 _walletCapAL) external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().walletCap[0] = _walletCapAL;
        TokenFacetLib.getState().walletCap[1] = _walletCap;
    }

    function toggleBurnStatus() external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().burnStatus = !TokenFacetLib.getState().burnStatus;
    }

    function setBaseURI(string memory URI) external {
        GlobalState.requireCallerIsAdmin();
        TokenFacetLib.getState().baseURI = URI;
    }

    function setName(string memory name) external {
        GlobalState.requireCallerIsAdmin();
        ERC721AStorage.layout()._name = name;
    }

    function setSymbol(string memory symbol) external {
        GlobalState.requireCallerIsAdmin();
        ERC721AStorage.layout()._symbol = symbol;
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

        uint256 _price = al ? s.price[0] : s.price[1];
        require(msg.value == _price * amount, "TokenFacet: incorrect amount of ether sent");

        uint256 _walletCap = al ? s.walletCap[0] : s.walletCap[1];
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

    // METADATA & MISC FUNCTIONS //

    function tokenURI(uint256 tokenId) public override view returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();
        uint256 saleTimestamp = SaleHandlerLib.getState().saleTimestamp;
        
        if(block.timestamp >= saleTimestamp) {
            uint256 DAY_NUMBER = ((block.timestamp - saleTimestamp) / 1 days) + 1;
            uint256[] memory breakPoints = TokenFacetLib.getState().breakPoints;
            uint256 DEFAULT_AFTER_ONE_YEAR = breakPoints[2];

            if(DAY_NUMBER > breakPoints[0] && DAY_NUMBER < breakPoints[1]) {
                return string(abi.encodePacked(_baseURI(), _toString(DAY_NUMBER)));
            }
            else if(DAY_NUMBER >= breakPoints[1] && DAY_NUMBER < breakPoints[2]) {
                uint256 length = breakPoints[2] - breakPoints[1];
                uint256[] memory array = new uint256[](length);

                for(uint256 i; i < length; i++) {
                    array[i] = i + breakPoints[1];
                }

                for(uint256 i = length - 1; i > 0; i--) {
                    uint256 j = TokenFacetLib.random((tokenId), i + 1);
                    (array[i], array[j]) = (array[j], array[i]);
                }

                uint256 currentDayURI = array[DAY_NUMBER - breakPoints[1]];
                return string(abi.encodePacked(_baseURI(),  _toString(currentDayURI)));
            }
            else if (DAY_NUMBER >= breakPoints[2]) {
                return string(abi.encodePacked(_baseURI(),  _toString(DEFAULT_AFTER_ONE_YEAR)));
            }
        } 
        else {
            return string(abi.encodePacked(_baseURI(), _toString(0)));
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

    function _baseURI() internal view override returns (string memory) {
        return TokenFacetLib.getState().baseURI;
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
}