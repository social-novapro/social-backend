const router = require('express').Router();
const { confirmChangePass } = require('../../../../../../utils/email/password');

router.post('/:passVerID', async (req, res) => {
    const { passVerID } = req.params;

    const { curPassword, confirmPassword, newPassword } = req.body;
    const changePassworConfirm = await confirmChangePass({ passVerID: passVerID, newPass: newPassword, conNewPass: confirmPassword, curPass: curPassword });

    if (!changePassworConfirm || changePassworConfirm.error) return res.status(400).send(changePassworConfirm);
    else return res.status(200).send(changePassworConfirm);
});

module.exports = router;
