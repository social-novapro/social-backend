const router = require('express').Router();
const { 
    updateUsernameLc, undoUsernameLc, 
    updateTimestamps, undoTimestamps, 
    updatePostIndexes, undoPostIndexes, 
    updateBadges, undoBadges,
    updatePostEmbeddings, undoPostEmbeddings,
    updateUserPostIndexes,
    undoUserPostIndexes
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



module.exports = router;
