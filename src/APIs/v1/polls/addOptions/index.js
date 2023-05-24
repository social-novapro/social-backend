const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const { createNewPollOption, findPoll } = require('../../../../utils/polls');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    
    // optionAmount = number of options
    // option_#num = option title
    const userID = req.headers.userid;
    const { optionAmount, pollID } = req.body;
    if (!pollID) return res.status(400).send(searchError("O012"))

    const pollExists = await findPoll({ pollID });
    if (pollExists.error) return res.status(404).send(pollExists)

    var options = [];

    for (var i = 0; i < optionAmount; i++) {
        if (!req.body[`option_${i+1}`]) return res.status(400).send(searchError("O013"));
        
        const optionTitle = req.body[`option_${i+1}`];

        const newOption = await createNewPollOption({ userID, pollID, optionTitle})
        options.push(newOption)
    }

    const foundPoll = await findPoll({ pollID });
    if (!options[0]) return res.status(400).send(searchError("O014"));
    else return res.status(200).send({ finalPoll: foundPoll, addedOptions: options, oldPoll: pollExists});
});

module.exports = router;
