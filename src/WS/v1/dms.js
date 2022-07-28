const interactDmsGroupsSchema = require('../../schemas/websocket/dms/interactDmsGroupsSchema');
const interactDmsIndexSchema = require('../../schemas/websocket/dms/interactDmsIndexSchema');
const interactDmsMessagesSchema = require('../../schemas/websocket/dms/interactDmsMessagesSchema');
const interactDmsUserGroupsSchema = require('../../schemas/websocket/dms/interactDmsUserGroupsSchema');
const interactUserSchema = require('../../schemas/interactUserSchema');
const {v4 : uuidv4} = require('uuid');
const checktime = require('../../utils/checktime');

async function getNewGroupID() {
    const newGroupID = uuidv4()
    const foundGroup = interactDmsGroupsSchema.findOne({ _id: newGroupID }) 
    if (foundGroup) return getNewGroupID()
    else return newGroupID
}

async function newGroup({ userID, members }) {
    const newGroupID = await getNewGroupID()

    await createNewGroupWithOwner({ userID, "groupID" : newGroupID });

    var errors = []
    for (const memberID of members) {
        const checkUser = await checkUserExists({ "userID": memberID });
        if (checkUser.found==true){
            await addUserToGroupDatabase({ memberID, "groupID": newGroupID });
        } else {
            errors.push({"error" : `${memberID} not found`});
        }
    }

    const newGroup = await interactDmsGroupsSchema.findOne({_id: newGroupID })
    if (!newGroup) return { "success" : false, "error" : "Unknown", errors }
    return { "success": true, "groupID": newGroupID, "group": newGroup, errors}
}

async function createNewGroupWithOwner({ userID, groupID }) {
    await interactDmsGroupsSchema.create(
        { _id: groupID },
        {
            owner: userID,
            created: checktime()
        }
    );

    await addUserToGroupDatabase({ "memberID" : userID, groupID});
    return true;
}

async function addUserToGroupDatabase({ memberID, groupID}) {
    await interactDmsUserGroupsSchema.findOneAndUpdate(
        { _id: memberID },
        { $push : { "groups": {
            _id: groupID,
            timestamp: checktime(),
        }}},
        { upsert: true}
    );
    
    await interactDmsGroupsSchema.findOneAndUpdate(
        { _id: groupID },
        { $push : { "users" : {
            _id: memberID,
            timestamp: checktime()
        }}},
        { upsert: true}
    );
    return true;
}

async function checkUserExists({ userID }) {
    const foundUser = interactUserSchema.findOne({_id: userID});
    if (!foundUser) return { 'found': false }
    else return { 'found': true}
}

async function newMessage({ userID, groupID }) {

    return false
}

async function deleteMessage({userID, groupID, messageID}) {

    return false
}

async function editMessage({}) {
    
    return false
}

async function getIndex({ indexID, action }) {
    var returnData = {
        found: false,
        index: []
    }
    if (indexID && action=="next") {
        /*
            get next id (look for when indexID==previous)
        */
    } else if (indexID && action=="previous") {
        /*
            get previous id (so look for when indexID==nextID)
        */
    } else {
        /*
            get current id
        */
    }

    return
}

async function getGroups() {

    return
}

module.exports = {


}