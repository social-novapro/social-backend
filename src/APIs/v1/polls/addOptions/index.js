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
    if (!pollID) return res.status(400).send({ "error" : "Please insert a pollID"})

    const pollExists = await findPoll({ pollID });
    console.log(pollExists)
    if (pollExists.error) return res.status(404).send(pollExists)

    var options = [];

    for (var i = 0; i < optionAmount; i++) {
        if (!req.body[`option_${i+1}`]) return res.status(400).send(searchError("option title not found"));
        
        const optionTitle = req.body[`option_${i+1}`];

        const newOption = await createNewPollOption({ userID, pollID, optionTitle})
        options.push(newOption)
    }

    const foundPoll = await findPoll({ pollID });
    if (!options[0]) return res.status(404).send(searchError("uh"));
    else return res.status(200).send({ finalPoll: foundPoll, addedOptions: options, oldPoll: pollExists});
});

module.exports = router;
