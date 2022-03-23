const router = require('express').Router();
const interactUserAnalyticSchema = require('../../../../schemas/analytics/interactUserAnalyticSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    // if (tokenData.authorized == false) return res.status(401).send(tokenData);

    
    const analytics = await interactUserAnalyticSchema.find();

    
    for (const userAnalytic of analytics) { 
        
    }
    console.log(analytics)
    return res.status(200).send(analytics);

})

module.exports = router;
