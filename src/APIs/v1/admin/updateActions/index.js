const router = require('express').Router();
const { 
    updateUsernameLc, undoUsernameLc, 
    updateTimestamps, undoTimestamps, 
    updatePostIndexes, undoPostIndexes, 
    updateBadges, undoBadges,
    updatePostEmbeddings, undoPostEmbeddings,
    updateUserPostIndexes,
    undoUserPostIndexes,
    updateCategorizePosts,
    undoCategorizePosts,
    updateLikePostsIndexes,
    undoLikePostsIndexes
} = require('../../../../utils/admin/actions');

const { searchErrorV2 } = require('../../../../utils/searchError');
const { current } = require('../../../../../config.json');

function canUndo() {
    if (current == "dev") return true;
    return false;
}

router.get('/usernameLc', async (req, res) => {
    const foundIssue = await updateUsernameLc({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/undoUsernameLc', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoUsernameLc({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/timestamp', async (req, res) => {
    const foundIssue = await updateTimestamps({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/undoTimestamp', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoTimestamps({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/postIndexes', async (req, res) => {
    const foundIssue = await updatePostIndexes({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/undoPostIndexes', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoPostIndexes({ adminID: req.headers.userid });
    if (foundIssue?.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/badges', async (req, res) => {
    const foundIssue = await updateBadges({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/undoBadges', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoBadges({ adminID: req.headers.userid });
    if (foundIssue?.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/postEmbeddings', async (req, res) => {
    res.send({ msg: "loading" })
    const foundIssue = await updatePostEmbeddings({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/undoPostEmbeddings', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoPostEmbeddings({ adminID: req.headers.userid });
    if (foundIssue?.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});


// http://localhost:5002/v1/admin/updateActions/postUserIndexes
router.get('/postUserIndexes', async (req, res) => {
    const foundIssue = await updateUserPostIndexes({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/undoPostUserIndexes
router.get('/undoPostUserIndexes', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoUserPostIndexes({ adminID: req.headers.userid });
    if (foundIssue?.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// new post embeddings
// http://localhost:5002/v1/admin/updateActions/postEmbeddings2
router.get('/postEmbeddings2', async (req, res) => {
    res.send({ msg: "loading" })
    const foundIssue = await updatePostEmbeddings({ adminID: req.headers.userid, version: "2" });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});
// http://localhost:5002/v1/admin/updateActions/undoPostEmbeddings2
router.get('/undoPostEmbeddings2', async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoPostEmbeddings({ adminID: req.headers.userid, version: "2"  });
    if (foundIssue?.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/categorizePosts
router.get("/categorizePosts", async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await updateCategorizePosts({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/undoCategorizePosts
router.get("/undoCategorizePosts", async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoCategorizePosts({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/categorizePosts2
router.get("/categorizePosts2", async (req, res) => {
 //   if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue1 = await updatePostEmbeddings({ adminID: req.headers.userid, version: "3" });
    if (foundIssue1.error) return res.status(400).send(foundIssue1);

    const foundIssue = await updateCategorizePosts({ adminID: req.headers.userid, version: "2" });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/undoCategorizePosts2
router.get("/undoCategorizePosts2", async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue1 = await undoPostEmbeddings({ adminID: req.headers.userid, version: "3" });
    if (foundIssue1.error) return res.status(400).send(foundIssue1);

    const foundIssue = await undoCategorizePosts({ adminID: req.headers.userid, version: "2" });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/likePostsIndexes
router.get("/likePostsIndexes", async (req, res) => {
//    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await updateLikePostsIndexes({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

// http://localhost:5002/v1/admin/updateActions/undoLikePostsIndexes
router.get("/undoLikePostsIndexes", async (req, res) => {
    if (!canUndo()) return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoLikePostsIndexes({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

module.exports = router;
