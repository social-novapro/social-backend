const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const interactUserSchema = require('../../../../schemas/interactUserSchema');

router.get('/:username', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const { username } = req.params

    const users = await interactUserSchema.find()
    var possibleUsers = []

    for (const user of users) {
        
        if (user?.username?.startsWith(username)) {

            var possiblity = username.length / user.username.length
            var pushUser = {
                possiblity: possiblity.toFixed(3),
                user
            }

            possibleUsers.push(pushUser)
        }
    }

    if (!possibleUsers) return res.status(404).send({"error": "could not find any possible matching tags"})
    possibleUsers.sort((firstItem, secondItem) => firstItem.possiblity - secondItem.possiblity);
    
    possibleUsers.reverse()
    return res.status(200).send(possibleUsers);
});

module.exports = router;
