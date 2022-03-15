const router = require('express').Router();
const interactUserSchema = require('../../../../schemas/interactUserSchema');
const interactUserPrivSchema = require('../../../../schemas/interactUserPrivSchema');
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkPostContent } = require('../../../../utils/checks');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.put('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { content, postID, userID, userToken} = req.body;

    if (!content && !userID && !postID && !userToken) return res.status(400).send("no content, userid, and postid");//searchError("E001"))
    else if (!content && !userID && !postID) return res.status(400).send("no content, userid, and postid");//searchError("E001"))
    else if (!content && !userID && !userToken) return res.status(400).send("no content, userid, and postid");//searchError("E001"))
    else if (!userID && !postID && !userToken) return res.status(400).send("no content, userid, and postid");//searchError("E001"))
    else if (!content && !postID) return res.status(400).send("no content and postid");//searchError("E001"))
    else if (!content && !userID) return res.status(400).send("no content and userid");//searchError("E001"))
    else if (!content && !userToken) return res.status(400).send("no content and postid");//searchError("E001"))
    else if (!postID && !userID) return res.status(400).send("no userid and no postid");//searchError("E001"))
    else if (!userID && !userToken) return res.status(400).send("no userid and no postid");//searchError("E001"))
    else if (!postID && !userToken) return res.status(400).send("no userid and no postid");//searchError("E001"))
    else if (!content) return res.status(400).send("no content");//searchError("E002"))
    else if (!userID) return res.status(400).send("no userid");//searchError("E003"))
    else if (!postID) return res.status(400).send("no postid");//searchError("E003"))
    else if (!userToken) return res.status(400).send("no userToken");//searchError("E003"))
    else if (content.length > 512) return res.status(400).send("");//searchError("E005"))

    const checkedContent = await checkPostContent(content);
    if (checkedContent) return res.status(400).send(checkedContent.error);

    const userIDCheck = await interactUserSchema.findOne({ _id: userID});
    if (!userIDCheck) return res.status(403).send("no user found");//searchError("E004"))

    const userTokenCheck = await interactUserPrivSchema.findOne({_id: userID}) ;
    if (userTokenCheck.userToken != userToken) return res.status(403).send("that user token is incorrect.");

    const postCheck = await interactPostSchema.findOne({ _id: postID});

    if (!postCheck) return res.status(403).send("no post with that id");//("E004"))
    else if (postCheck.userID != userID) return res.status(403).send("that userid and post's userid doesnt match");//("E004"))
    else if (postCheck.content == content) return res.status(403).send("content is the same");//("E004"))

    const editedTimestamp = checktime();
    var editedAmount;
    if (postCheck.editedAmount == null) editedAmount = 0;
    else editedAmount = postCheck.editedAmount + 1;
    
    await interactPostSchema.findOneAndUpdate(
        { _id: postID }, 
        { content, edited: true, editedTimestamp, editedAmount }
    );

    const PostData = await interactPostSchema.findOne({_id: postID});
    if (!PostData) return res.status(404).send(searchError("D002"));
    else return res.status(200).send({"new" : PostData, "before" : postCheck});
})

module.exports = router;
