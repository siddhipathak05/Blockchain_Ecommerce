const web3 = new Web3(window.ethereum); // Connect to MetaMask

const contractAddress = "0x31Cb33AE8df5a529ebD00BBaF7a2b11c1281f69e";  // Replace with your actual contract address
const contractABI =  [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "itemId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "itemHash",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			}
		],
		"name": "ItemListed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "itemId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "ItemPurchased",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_itemHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_price",
				"type": "uint256"
			}
		],
		"name": "listItem",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_itemId",
				"type": "uint256"
			}
		],
		"name": "purchaseItem",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_itemId",
				"type": "uint256"
			}
		],
		"name": "getItem",
		"outputs": [
			{
				"internalType": "string",
				"name": "itemHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isSold",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getItemCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "items",
		"outputs": [
			{
				"internalType": "string",
				"name": "itemHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isSold",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

// 🔹 Connect MetaMask
async function connectWallet() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const accounts = await web3.eth.getAccounts();
    document.getElementById("wallet").innerText = `Connected: ${accounts[0]}`;
}

// List an item
async function listItem() {
    const accounts = await web3.eth.getAccounts();
    const itemHash = document.getElementById("itemHashInput").value;
    const price = web3.utils.toWei(document.getElementById("priceInput").value, 'ether');
    
    await contract.methods.listItem(itemHash, price).send({ from: accounts[0] });
    alert(`Item listed: ${itemHash} for ${price} wei`);
}

// Purchase an item
async function purchaseItem() {
    try {
        const itemId = document.getElementById("itemIdInput").value;
        if (!itemId) {
            alert("Please enter an Item ID");
            return;
        }

        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
            alert("No accounts found. Please connect your wallet.");
            return;
        }

        const item = await contract.methods.getItem(itemId).call();
        if (!item || !item.itemHash) {
            alert("Item not found");
            return;
        }

        if (item.isSold) {
            alert("This item has already been sold");
            return;
        }

        const priceWei = item.price;
        const priceEth = web3.utils.fromWei(priceWei, 'ether');

        // Validate price
        if (priceWei <= 0) {
            alert("Invalid price");
            return;
        }

        // Check user balance
        const balance = await web3.eth.getBalance(accounts[0]);
        if (BigInt(balance) < BigInt(priceWei)) {
            alert("Insufficient balance");
            return;
        }

        // Estimate gas (fail early if transaction would revert)
        // try {
        //     const gas = await contract.methods.purchaseItem(itemId).estimateGas({
        //         from: accounts[0],
        //         value: priceWei
        //     });
        //     console.log("Estimated gas:", gas);
        // } catch (estimateError) {
        //     console.error("Gas estimate failed:", estimateError);
        //     alert(`Transaction will fail: ${estimateError.message}`);
        //     return;
        // }

        // Send transaction
        const receipt = await contract.methods.purchaseItem(itemId).send({
            from: accounts[0],
            value: priceWei
        });

        console.log("Transaction receipt:", receipt);
        alert(`Successfully purchased item ${itemId} for ${priceEth} ETH`);
        
        // Refresh UI
        await getItemDetails(itemId);
        getTotalItems();
    } catch (error) {
        console.error("Purchase error:", error);
        if (error.message.includes("User denied transaction signature")) {
            alert("Purchase canceled by user");
        } else {
            alert(`Purchase failed: ${error.message}`);
        }
    }
}

async function getItemDetails() {
    try {
        const itemId = document.getElementById("itemIdInput").value;
        if (!itemId) {
            alert("Please enter an Item ID");
            return;
        }

        const item = await contract.methods.getItem(itemId).call();
        
        if (!item.itemHash) {
            alert("Item not found");
            return;
        }

        // Format the display
        const details = `
            Item ID: ${itemId}
            Hash: ${item.itemHash}
            Price: ${web3.utils.fromWei(item.price, 'ether')} ETH
            Seller: ${item.seller}
            Status: ${item.isSold ? 'Sold' : 'Available'}
            Listed by: ${item.seller}
        `;

        alert(details);
    } catch (error) {
        console.error("Error fetching item:", error);
        alert(`Failed to get item details: ${error.message}`);
    }
}

async function getTotalItems() {
    try {
        const count = await contract.methods.getItemCount().call();
        const display = document.getElementById("itemCountDisplay");
        
        // Format nicely
        display.innerHTML = `
            <h3>Marketplace Status</h3>
            <p>Total Items Listed: <strong>${count}</strong></p>
            <small>Last updated: ${new Date().toLocaleTimeString()}</small>
        `;
    } catch (error) {
        console.error("Error getting item count:", error);
        document.getElementById("itemCountDisplay").innerText = "Error loading count";
    }
}







