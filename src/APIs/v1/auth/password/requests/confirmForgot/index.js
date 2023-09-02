const router = require('express').Router();
const { confirmForgotPass } = require('../../../../../../utils/email/password');

router.post('/:passVerID', async (req, res) => {
    const { passVerID } = req.params;

    const forgotPasswordConfirm = await confirmForgotPass({ passVerID });

    if (!forgotPasswordConfirm || forgotPasswordConfirm.error) return res.status(400).send(forgotPasswordConfirm);
    else return res.status(200).send(forgotPasswordConfirm);
});

module.exports = router;
