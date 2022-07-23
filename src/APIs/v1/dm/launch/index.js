const crypto = require('crypto');
const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const { searchError } = require('../../../../utils/searchError');
const key = require("../../../../schemas/interactE2EESchema/key");
const {v4 : uuidv4} = require('uuid');
// launch is used for all steps of the initial key exchange. 

/*
 * RSA:
 *
 * 1: alice POSTS with targetuser and launchPubKey.
 * 2: bob will make periodic GET requests. the GET request will return a user and launchPubKey.
 *    if a launchPubKey is found, bob sees it and moves to step 3.
 * 3: bob creates a symmetric keypair. The server cannot do this for privacy reasons,
 *    so bob must make sure it is secure. Bob encrypts this symmetric key
 *    with the assymetric pubkey from alice.
 * 4; bob posts with targetuser and encSymKey.
 * 5: alice also makes periodic GET requests. This time, she sees bob and an encSymKey.
 *    She tries to decrypt it with her private key stored in cache.
 * 6: Alice and bob now both share a symmetric key. 
 *    They can now send messages through send and fetch messages through fetch.
 *    These messages are encrypted with the symmetric key.
 * 
 * encSymKey should be base64 encoded.
 *          --Base64
 * 
 * For ECDH, just have bob do launchPubKey instead of encSymKey when he sees alice's launchPubKey. 
 * elliptic curve cryptography must be used.
 * 
 * 
 * 
 * the server will throw an error if any keys are invalid, or if any messages are unencrypted.
 * the server will throw an error if any keys are using a weak algorithm. 
 * the client must store the keys in a safe place. If the keys are lost all messages are lost.
 */
router.post("/", async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    try {
    if(req.body.launchPubKey) stepOne(req, res);  // alice gives bob public key
    if(req.body.encSymKey) stepTwo(req, res);     // bob gives alice encrypted symmetric key
    if(req.body.initMessage) stepThree(req, res); // alice decrypts symmetric key, uses it to encrypt a first message to start the channel.
    } catch(e){
        return res.status("500").send(searchError("Z001"));
    }
    

});
router.get("/", async (req, res) => {

});

const stepOne = (req, res) => {
    let {userID, targetUser, launchPubKey, algo} = req.body;
    if(userID != req.headers.userID) return res.status(400).send(searchError("E009"));
    try {
        crypto.KeyObject.from(launchPubKey);
    } catch(e) {
        return res.status("400").send(searchError("M001"));
    }
    let pubKey = crypto.KeyObject.from(launchPubKey);
    if(pubKey.assymetrickeyType != algo) return res.status("400").send(searchError("M002"));
    if(!(['rsa', 'ed25519'].contains(pubKey.assymetrickeyType))) return res.status("400").send(searchError("M003"));
    let keyId = uuidv4()
    if((await key.findOne({_id: keyId})).result){
        keyId = uuidv4();
    }

    await key.findOneAndUpdate({_id: keyId}, {
        _id: keyId,
        userID: userID,
        targetuserID: targetUser,
        key: pubKey,
        keyType: algo
    }, {upsert: true});

};
const stepTwo = (req, res) => {
    let {userID, targetUser, encSymKey} = req.body;
    if(userID != req.headers.userID) return res.status(400).send(searchError("E009"));
    
    let pubKey = encSymKey;
    let keyId = uuidv4()
    if((await key.findOne({_id: keyId})).result){
        keyId = uuidv4();
    }

    await key.findOneAndUpdate({_id: keyId}, {
        _id: keyId,
        userID: userID,
        targetuserID: targetUser,
        key: pubKey,
        keyType: algo
    }, {upsert: true});
};
const stepThree = (req, res) => {
    // initialize new livechat. this livechat can only be accessed by the two people in the e2ee dm.
}