const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { findPoll } = require('../../../../utils/polls');

router.get('/:pollID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { pollID } = req.params;
    const foundPoll = await findPoll({ pollID, userID: req.headers.userid });

    if (foundPoll.error) return res.status(404).send(foundPoll);
    else return res.status(200).send(foundPoll);
});

module.exports = router;
