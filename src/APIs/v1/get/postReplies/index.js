const router = require('express').Router();
const interactRepliesSchema = require('../../../../schemas/postSchemas/interactRepliesSchema');
const {searchErrorV2} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const interactPostSchema = require('../../../../schemas/interactPostSchema');

router.get('/:postID', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID } = req.params;
    
    const postData = await interactPostSchema.findOne({_id: postID});
    if (!postData) return res.status(404).send(searchErrorV2("D001", { userID: req.headers.userid }));
    else if (!postData.replyIndexID) return res.status(404).send(searchErrorV2("D012", { userID: req.headers.userid }));

    const replyIndex = await interactRepliesSchema.findOne({ _id: postData.replyIndexID });
    const dataArr = [];
    for (const reply of replyIndex.postIDs) {
        const replyData = await interactPostSchema.findOne({_id: reply});
        dataArr.push(replyData);
    }
    const dataSend = {
        'post': postData,
        'replyIndex': replyIndex,
        'replies': dataArr
    }

    return res.status(200).send(dataSend);
})

module.exports = router;
