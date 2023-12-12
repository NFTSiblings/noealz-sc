//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "erc721a/contracts/ERC721A.sol";

contract testToken is ERC721A {

    string baseURI = "ipfs://bafybeicngjcorh6h7inah76zqiwybt4n262ga4pnk4puds7azc5h5u633m/";

    constructor() ERC721A("", "") {}

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setbaseURI(string memory uri) public {
        baseURI = uri;
    }

    function reserve(uint256 quantity) public {
        _safeMint(msg.sender, quantity);
    }

    function burnMany(uint256[] memory tokenIds) public {
        for(uint256 i; i < tokenIds.length;) {
            _burn(tokenIds[i]);
            unchecked {
                i++;
            }
        }
    }

}