const { confirmDelete } = require('../../../../../utils/user/deleteUser');

const router = require('express').Router();

router.delete('/:delAccVerID', async (req, res) => {
    const { delAccVerID } = req.params;

    const { password } = req.body;
    const deletedAcc = await confirmDelete({ deleteID: delAccVerID, password});

    if (!deletedAcc || deletedAcc.error) return res.status(400).send(deletedAcc);
    else return res.status(200).send({deletedAcc});
});

module.exports = router;
