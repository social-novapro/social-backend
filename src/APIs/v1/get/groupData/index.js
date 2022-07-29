const router = require('express').Router();
const { searchError } = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const interactDmsGroupsSchema = require('../../../../schemas/websocket/dms/interactDmsGroupsSchema');
const { getGroupData } = require('../../../../WS/v1/dms');

router.get('/:groupID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);
    const { groupID } = req.params

    if (!groupID) return res.status(400).send({error: "You didnt include a groupID"})

    const groupData = await getGroupData({ "userID" : req.headers.userid, groupID})
    if (groupData.success == false) return res.status(400).send(groupData)

    // getGroupData({ userID: req.headers.userid, groupID})
    return res.status(200).send(groupData);
});

module.exports = router;
