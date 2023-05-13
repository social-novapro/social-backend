const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { createPoll } = require('../../../../utils/polls');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const userID = req.headers.userid;

    // optionAmount = number of options
    // option_#num = option title
    const { pollName, timeLive, optionAmount } = req.body;

    var options = [];
    for (var i = 0; i < optionAmount; i++) {
        options.push({ optionTitle: req.body[`option_${i}`] });
    }

    const newPoll = await createPoll({ userID, pollOptions: { pollName, timeLive, options }});

    if (!newPoll) return res.status(404).send(searchError(""));
    else return res.status(200).send({newPoll});
});

module.exports = router;
