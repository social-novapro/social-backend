const router = require('express').Router();
const { getNotifData, getNotifDataType, setNotifPreferences, setNotifPreference, getAllNotifPreferences } = require('../../../../utils/notificationCenter/updatePreferences');

/**
 * description: get all notification preferences, including different system types
 * 
 * query:  none
 */
router.get('/', async (req, res) => {
    const foundPrefs = await getAllNotifPreferences({
        userID: req.headers.userid,
    });
    return res.status(200).send(foundPrefs);
})

/**
 * description: get all preference for a specific system type
 * 
 * query:  
 *  systemType - which system to get
 */
router.get('/:systemType', async (req, res) => {
    const foundPrefs = await getNotifData({
        userID: req.headers.userid,
        typeID: req.params.typeID,
        systemType: req.params.systemType
    });
    return res.status(200).send(foundPrefs);
})

/**
 * description: get a single notification preference for a specific system type
 * 
 * query:  
 *  systemType - which system to get
 *  typeID - which setting to get
 */
router.get('/:systemType/:typeID', async (req, res) => {
    const foundPrefs = await getNotifDataType({
        userID: req.headers.userid,
        typeID: req.params.typeID,
        systemType: req.params.systemType
    });
    return res.status(200).send(foundPrefs);
})

/**
 * description: get a single notification preference
 * 
 * query:  typeID - which setting to get
 */
router.get('/:typeID', async (req, res) => {
    const foundPrefs = await getNotifDataType({
        userID: req.headers.userid,
        typeID: req.params.typeID
    });
    return res.status(200).send(foundPrefs);
})


/**
 * description: set multiple notification preferences
 * 
 * query:  none
 * 
 * body : {
 *    systemType: num (default 1=inapp)
 *    changes: [ { typeID: num, enabled: bool }]
 * }
 */
router.post('/', async (req, res) => {
    const foundPrefs = await setNotifPreferences({ 
        userID: req.headers.userid,
        systemType: req.body.systemType,
        changes: req.body.changes
    });
    return res.status(200).send(foundPrefs);
})

/**
 * description: set a single notification preference
 * 
 * query:  typeID - which setting to change
 * 
 * body : {
 *    systemType: num (default 1=inapp)
 *    typeID: num
 *    enabled: bool
 * }
 */
router.post('/:typeID', async (req, res) => {
    const foundNotif = await setNotifPreference({
        userID: req.headers.userid,
        systemType: req.body.systemType,
        typeID: req.params.typeID,
        enabled: req.body.enabled
    });
    return res.status(200).send(foundNotif);
})

module.exports = router;
