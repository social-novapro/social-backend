const router = require('express').Router();
const { updateUsernameLc, undoUsernameLc, updateTimestamps, undoTimestamps, updatePostIndexes, undoPostIndexes } = require('../../../../utils/admin/actions');
const { searchErrorV2 } = require('../../../../utils/searchError');

router.get('/usernameLc', async (req, res) => {
    const foundIssue = await updateUsernameLc({ adminID: req.headers.userid });
    if (foundIssue.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

router.get('/undoUsernameLc', async (req, res) => {
    return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
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
    //return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
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
    //return res.status(400).send(searchErrorV2("R014", { userID: req.headers.userid }));
    const foundIssue = await undoPostIndexes({ adminID: req.headers.userid });
    if (foundIssue?.error) return res.status(400).send(foundIssue);
    return res.status(200).send(foundIssue);
});

module.exports = router;
