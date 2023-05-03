const router = require('express').Router();
const interactUserAnalyticSchema = require('../../../../schemas/analytics/interactUserAnalyticSchema');
const {searchError} = require('../../../../utils/searchError');
const { checkRequestTokens } = require('../../../../utils/checkRequestTokens');
const possibleFunctions = require('../../../../utils/analytics/functions');

router.get('/', async (req, res) => {
    const tokenData = await checkRequestTokens(req);
    // if (tokenData.authorized == false) return res.status(401).send(tokenData);

    
    const analytics = await interactUserAnalyticSchema.find();

    
    for (const userAnalytic of analytics) { 
        
    }
    console.log(analytics)
    return res.status(200).send(analytics);

})

router.get('/1', async (req, res) => {
    const tokenData = await checkRequestTokens(req);

    const analytics = await interactUserAnalyticSchema.find();
    const functionData = possibleFunctions.buildFunction1(analytics);
    console.log(functionData)

    return res.status(200).send(functionData);
})

router.get('/2', async (req, res) => {
    const tokenData = await checkRequestTokens(req);

    const analytics = await interactUserAnalyticSchema.find();
    const functionData = possibleFunctions.buildFunction2(analytics);
    console.log(functionData)

    return res.status(200).send(functionData);
})

router.get('/3', async (req, res) => {
    const tokenData = await checkRequestTokens(req);

    const analytics = await interactUserAnalyticSchema.find();
    const functionData = possibleFunctions.buildFunction3(analytics);
    console.log(functionData)

    return res.status(200).send(functionData);
})

router.get('/4', async (req, res) => {
    const tokenData = await checkRequestTokens(req);

    const analytics = await interactUserAnalyticSchema.find();
    const functionData = possibleFunctions.buildFunction4(analytics);
    console.log(functionData)

    return res.status(200).send(functionData);
})

module.exports = router;
