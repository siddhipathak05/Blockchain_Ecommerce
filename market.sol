// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Marketplace {
    struct Item {
        string itemHash;
        uint256 price;
        address seller;
        bool isSold;
    }

    Item[] public items;
    address public owner;

    event ItemListed(uint256 itemId, string itemHash, uint256 price, address seller);
    event ItemPurchased(uint256 itemId, address buyer, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // List a new item for sale
    function listItem(string memory _itemHash, uint256 _price) public {
        require(bytes(_itemHash).length > 0, "Item hash cannot be empty");
        require(_price > 0, "Price must be greater than 0");

        items.push(Item({
            itemHash: _itemHash,
            price: _price,
            seller: msg.sender,
            isSold: false
        }));

        emit ItemListed(items.length - 1, _itemHash, _price, msg.sender);
    }

    // Purchase an item
    function purchaseItem(uint256 _itemId) public payable {
        require(_itemId < items.length, "Item does not exist");
        Item storage item = items[_itemId];
        require(!item.isSold, "Item already sold");
        require(msg.value == item.price, "Incorrect payment amount");
        require(msg.sender != item.seller, "Seller cannot buy their own item");

        payable(item.seller).transfer(msg.value);
        item.isSold = true;

        emit ItemPurchased(_itemId, msg.sender, item.price);
    }

    // Get total number of items
    function getItemCount() public view returns (uint256) {
        return items.length;
    }

    // Get item details
    function getItem(uint256 _itemId) public view returns (
        string memory itemHash,
        uint256 price,
        address seller,
        bool isSold
    ) {
        require(_itemId < items.length, "Item does not exist");
        Item storage item = items[_itemId];
        return (item.itemHash, item.price, item.seller, item.isSold);
    }

    // Withdraw contract balance (only owner)
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
