const crypto = require('crypto');
const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');


// launch is used for all steps of the initial key exchange. 

/*
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
 * the server will throw an error if any keys are invalid, or if any messages are unencrypted.
 * the server will throw an error if any keys are using a weak algorithm. 
 * the client must store the keys in a safe place. If the keys are lost all messages are lost.
 */
router.post("/", async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    if(req.body.launchPubKey) stepOne(req, res);
    if(req.body.encSymKey) stepTwo(req, res);

    

});
router.get("/", async (req, res) => {

});

const stepOne = (req, res) => {
    let targetUser = req.body.targetUser;
    
};
const stepTwo = (req, res) => {
    let targetUser = req.body.targetUser;

};