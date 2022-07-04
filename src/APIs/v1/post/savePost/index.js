const router = require('express').Router();
const interactPostBookmarks = require('../../../../schemas/postSchemas/interactPostBookmarks')
const interactPostSchema = require('../../../../schemas/interactPostSchema');
const { searchError } = require('../../../../utils/searchError');
const { checktime } = require('../../../../utils/checktime');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.post('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    if (tokenData.authorized == false) return res.status(401).send(tokenData);

    const { postID, listname } = req.body;
    const { userid } = req.headers;
    const userID = userid;

    if (!postID) return res.status(400).send(searchError("K001"));

    const postCheck = await interactPostSchema.findOne({ _id: postID});
    if (!postCheck) return res.status(403).send(searchError("K002"));//("E004"))

    const savedTimestamp = checktime();
    var userbookmarks = await interactPostBookmarks.findOne({ _id: userID }) 
    
    if (!userbookmarks) {
        await setupMainBookmark();
        userbookmarks = await interactPostBookmarks.findOne({ _id: userID });
    };

    var foundList = false;
    var foundMain = false;

    if (listname && userbookmarks && userbookmarks.lists) {
        for (const list of userbookmarks.lists) {
            if (list.name == listname) foundList = true;
            if (list.name == "main") foundMain = true;
        };
    };

    if (userbookmarks && userbookmarks.saves)  {
        for (const save of userbookmarks.saves) {
            if (save._id == postID) return res.status(403).send(searchError("K003"))
        }
    }
    if (!foundMain) await setupMainBookmark()
    var bookmarkToSave = foundList ? listname : "main"
    
    await interactPostBookmarks.findOneAndUpdate( 
        { _id: userID },
        { $push : { "saves" : { 
            _id: postID,
            bookmarkList: bookmarkToSave,
            timestamp: savedTimestamp
        }}},
        { upsert: true }
    );

    const Bookmarks = await interactPostBookmarks.findOne({ _id: userID });
    if (!Bookmarks) return res.status(404).send(searchError("K004"));
    else return res.status(200).send({Bookmarks});

    async function setupMainBookmark() {
        await interactPostBookmarks.findOneAndUpdate( 
            { _id: userID },
            { $push : { "lists" : { 
                name: "main",
                timestamp: savedTimestamp
            }}},
            { upsert: true }
        );
    };
});

module.exports = router;
