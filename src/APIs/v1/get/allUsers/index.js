const router = require('express').Router()
const interactUserSchema = require('../../../../schemas/interactUserSchema')
const { searchError } = require('../../../../utils/searchError')

router.get('/', async (req, res) => {
    const AllUsers = await interactUserSchema.find()
    
    // sendUsers = [ ]
    // for (user of AllUsers) if (user.content) sendPosts.push(post)
    
    if (!AllUsers) return res.status(404).send(searchError("C005"))
    else return res.status(200).send(AllUsers);
})

module.exports = router;
