// installing packages
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// structure of blockchain
let blockchain = [];
let pendingTransactions = [];

// asymmetric encryption 
const generateKeyPair = () => crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const { publicKey, privateKey } = generateKeyPair();

// digital  signature
const signData = (data) => crypto.sign('sha256', Buffer.from(data), privateKey);


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//encryption and digital signature integration
app.post('/createTransaction', (req, res) => {
    const { from, to, amount } = req.body;

  // encrypt and sign the data
    const encryptedData = crypto.publicEncrypt(publicKey, Buffer.from(JSON.stringify({ from, to, amount })));
    const signature = signData(JSON.stringify({ from, to, amount }));

  // add to pending transactions
    pendingTransactions.push({ encryptedData, signature });
    res.json({ message: 'Transaction added to pending transactions' });
});

// hashing
const calculateHash = (index, previousHash, timestamp, data, nonce) => crypto.createHash('sha256')
    .update(index + previousHash + timestamp + JSON.stringify(data) + nonce)
    .digest('hex');


const mineBlock = () => {
    const lastBlock = blockchain[blockchain.length - 1];
    const previousHash = lastBlock ? lastBlock.hash : '0'; // initial case
    const timestamp = Date.now();
    const index = lastBlock ? lastBlock.index + 1 : 0; // initial case
    const data = pendingTransactions;
    let nonce = 0;
    let hash = calculateHash(index, previousHash, timestamp, data, nonce);

    // Proof-of-work
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = calculateHash(index, previousHash, timestamp, data, nonce);
    }

    const newBlock = {
        index,
        timestamp,
        data,
        nonce,
        hash,
        previousHash,
    };

    // resetting pending transactions
    pendingTransactions = [];

    blockchain.push(newBlock);
    return { message: 'Block successfully mined and added to the blockchain.' };
};

// endpoint for mining a block
app.get('/mineBlock', (req, res) => {
    const response = mineBlock();
    res.json(response);
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
