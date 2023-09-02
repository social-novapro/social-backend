const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { findUserVote } = require('../../../../utils/polls');

router.get('/:pollID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { pollID } = req.params;
    const { userid: userID } = req.headers;

    // console.log("userID " + userID + " pollID " + pollID)
    const foundPoll = await findUserVote({ userID, pollID });
    if (foundPoll.error) return res.status(400).send(foundPoll);
    else return res.status(200).send(foundPoll);
});

module.exports = router;
