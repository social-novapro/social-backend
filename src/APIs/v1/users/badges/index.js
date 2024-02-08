const { searchErrorV2 } = require('../../../../utils/searchError');
const { allBadges, getUserBadges } = require('../../../../utils/user/badges');

const router = require('express').Router();

router.get('/', async (req, res) => {
    const badges = allBadges();
    if (!badges || badges.error) res.status(200).send(searchErrorV2("J009", { userID: req.headers.userid }))
    return res.status(200).send(badges)
})

router.get('/:userID', async (req, res) => {
    const badges = await getUserBadges({ userID: req.params.userID });
    if (!badges || badges.error) res.status(200).send(searchErrorV2("J009", { userID: req.headers.userid }))
    return res.status(200).send(badges)
})

module.exports = router;
