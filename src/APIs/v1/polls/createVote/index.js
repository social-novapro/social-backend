const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { createPollVote } = require('../../../../utils/polls');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { pollID, pollOptionID } = req.body;
    const userID = req.headers.userid;

    const newRequest = await createPollVote({ pollID, userID, pollOptionID });

    if (newRequest.error) return res.status(400).send(newRequest);
    else return res.status(200).send(newRequest);
});

module.exports = router;
