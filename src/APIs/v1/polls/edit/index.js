const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { editPollTitle } = require('../../../../utils/polls');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const userID = req.headers.userid;

    const { pollName, pollID } = req.body;

    if (pollName) {
        const editPoll = await editPollTitle({ userID, pollName, pollID });
        if (editPoll.error) return res.status(400).send(editPoll)
        else return res.status(200).send(editPoll);
    } else {
        return res.status(400).send(searchError("O015"));
    }
});

module.exports = router;
