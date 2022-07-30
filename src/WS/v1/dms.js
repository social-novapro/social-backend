const interactDmsGroupsSchema = require('../../schemas/websocket/dms/interactDmsGroupsSchema');
const interactDmsIndexSchema = require('../../schemas/websocket/dms/interactDmsIndexSchema');
const interactDmsMessagesSchema = require('../../schemas/websocket/dms/interactDmsMessagesSchema');
const interactDmsUserGroupsSchema = require('../../schemas/websocket/dms/interactDmsUserGroupsSchema');
const interactUserSchema = require('../../schemas/interactUserSchema');
const {v4 : uuidv4} = require('uuid');
const {checktime} = require('../../utils/checktime');

async function getNewGroupID() {
    const newGroupID = uuidv4();
    const foundGroup = await interactDmsGroupsSchema.findOne({ _id: newGroupID });

    if (foundGroup) return getNewGroupID()
    else return newGroupID;
};

async function getNewMessageID() {
    const newMessageID = uuidv4();
    const foundMessage = await interactDmsMessagesSchema.findOne({ _id: newMessageID });
    if (foundMessage) return getNewMessageID()
    else return newMessageID;
};

async function newGroup({ userID, members, groupName }) {
    const newGroupID = await getNewGroupID();
    var newGroupName;
    if (!groupName) newGroupName = "New Group."
    else newGroupName = groupName;
    // console.log(newGroupName)

    await createNewGroupWithOwner({ "userID": userID, "groupID" : newGroupID, "groupName" : newGroupName });

    members.push(userID);
    // console.log(members)

    var errors = [];
    for (const memberID of members) {
        const checkUser = await checkUserExists({ "userID" : memberID });
        if (checkUser.found==true){
            await addUserToGroupDatabase({ memberID, "groupID" : newGroupID });
        } else {
            errors.push({"error" : `${memberID} not found`});
        };
    };

    const newGroup = await interactDmsGroupsSchema.findOne({ _id: newGroupID });
    if (!newGroup) return { "success" : false, "error" : "Unknown", errors };
    return { "success" : true, "groupID": newGroupID, "group" : newGroup, errors };
};

async function removeUserFromGroup({ memberID, groupID }) {
    await interactDmsGroupsSchema.findOneAndUpdate(
        { _id: groupID },
        { $pull : { "users" : {
            _id: memberID
        }}}
    );

    await interactDmsUserGroupsSchema.findOneAndUpdate(
        { _id: memberID },
        { $pull : { "groups" : {
            _id: groupID
        }}}
    );

    return true;
};

async function deleteGroup({ userID, groupID }) {
    const groupData = await interactDmsGroupsSchema.findOne({ _id: groupID }) ;

    if (groupData.owner == userID) {
        for (const member of groupData.users) {
            await removeUserFromGroup({"memberID": member, groupID});
        };

        await interactDmsGroupsSchema.deleteOne({ _id: groupID });
    };
};

async function findUserInGroup({ groupID, userID }) {
    const find = await interactDmsGroupsSchema.findOne({ _id: groupID, _id : { $in : userID }});
    console.log(find);
};

async function createNewGroupWithOwner({ userID, groupID, groupName }) {
    // console.log("1")
    // console.log(userID)
    // console.log(groupName)
    await interactDmsGroupsSchema.findOneAndUpdate(
        { _id: groupID },
        {
            owner: userID,
            groupName,
            created: checktime()
        }, { upsert: true }
    );

    // await addUserToGroupDatabase({ "memberID" : userID, groupID});
    return true;
};

async function addUserToGroupDatabase({ memberID, groupID }) {
    // console.log("2")

    // const userGroupData = await interactDmsUserGroupsSchema.findOne({_id: memberID}) 

    // for (const group of userGroupData?.groups) {
    //     if (group._id == groupID){
    //         console.log('already in group.')
    //         return false;
    //     }
    // }
    await findUserInGroup({ groupID, "userID" : memberID });
    
    await interactDmsUserGroupsSchema.findOneAndUpdate(
        { _id: memberID },
        { $push : { "groups": {
            _id: groupID,
            timestamp: checktime(),
        }}},
        { upsert: true }
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
};

async function checkUserExists({ userID }) {
    const foundUser = await interactUserSchema.findOne({ _id: userID });
    if (!foundUser) return { 'found' : false };
    else return { 'found' : true };
};

async function changeGroupName({ userID, groupName }) {
    // check if in group
    // later: check if user has perms
    // then add name 
    // save the last groupname + who changed the name (later)
};

async function getGroupData({ userID, groupID }) {
    const foundGroup = await interactDmsGroupsSchema.findOne({ _id: groupID });
    if (!foundGroup) return { "success" : false, "error" : "Group not found." };
    var userIsMember = false;

    for (const member of foundGroup.users) {
        if (member._id==userID) userIsMember=true;
    };

    if (!userIsMember) return { "success" : false, "error" : "User not found inside group." };
    return { "success" : true, groupData: foundGroup };
};

async function deleteMessage({ userID, groupID, messageID }) {

    return false;
};

async function editMessage({}) {
    
    return false;
};

async function getIndex({ indexID, action }) {
    var returnData = {
        found: false,
        index: []
    };

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
    };

    return false;
};

async function sendMessage({ content, userID, groupID }) {
    /*
        check if userid in group
    */
   
    const groupData = await interactDmsGroupsSchema.findOne({ _id: groupID });
    if (!groupData) return { "error" : "Group not found." };
    const foundUser = groupData.users.find(({ user }) => user == userID);
    if (!foundUser) return { "error" : "User not found in group." };

    // var indexID;
    // const GroupIndexes = await interactDmsIndexSchema.findOne({ _id: groupID });
    
    // if (!GroupIndexes || !GroupIndexes.currentIndex) indexID = uuidv4()
    // else {
    //     // GroupIndexes
    //     const foundCurrent = GroupIndexes.users.find(({ searchIndexID }) => GroupIndexes.currentIndex == searchIndexID);
    //     if (foundCurrent.messageIDs.length > 100) {
    //         indexID = uuidv4()
    //     } else {
    //         indexID = foundCurrent._id 
    //     }
    // };

    var indexID

    if (!groupData.currentIndex) {
        indexID = uuidv4()
        await interactDmsGroupsSchema.findOneAndUpdate({
            _id: groupID,
        }, {
            currentIndex: indexID
        })
    } else {
        const IndexData = await interactDmsIndexSchema.findOne({_id: indexID})
        if (!IndexData) {
            indexID = uuidv4()
            await interactDmsGroupsSchema.findOneAndUpdate({
                _id: groupID,
            }, {
                currentIndex: indexID
            })
        } else if (!IndexData.messageID) {
            indexID = IndexData._id
        } else if (IndexData.messageIDs.length > 100) {
            indexID = uuidv4()
            await interactDmsGroupsSchema.findOneAndUpdate({
                _id: groupID,
            }, {
                currentIndex: indexID
            })
        };
    };

    // var indexID;
    // const GroupIndexes = await interactDmsIndexSchema.findOne({ _id: groupID });
    
    // if (!GroupIndexes || !GroupIndexes.currentIndex) indexID = uuidv4()
    // else {
    //     // GroupIndexes
    //     const foundCurrent = GroupIndexes.users.find(({ searchIndexID }) => GroupIndexes.currentIndex == searchIndexID);
    //     if (foundCurrent.messageIDs.length > 100) {
    //         indexID = uuidv4()
    //     } else {
    //         indexID = foundCurrent._id 
    //     }
    // };

    const messageID = await getNewMessageID();
    await interactDmsMessagesSchema.findOneAndUpdate(
        { _id: messageID },
        {
            _id: messageID,
            userID: messageID,
            indexID,
            groupID,
            content,
            timestamp: checktime()
        }, { upsert: true }
    );

    await interactDmsIndexSchema.findOneAndReplace(
        { _id: indexID },
        { $push : { "messageIDs" : messageID }},
        { upsert: true}
    );

    const newMessageData = await interactDmsMessagesSchema.findOne({ _id: messageID })
    if (!newMessageData) return { "error" : "message was not found" }
    else return newMessageData
};

async function getGroups({userID}) {
    const foundUser = checkUserExists({ userID });
    if (foundUser.found == false) return { "error" : "user not found" };

    const data = await interactDmsUserGroupsSchema.findOne({ _id: userID });
    if (!data) return { "error" : "no groups found" };

    return data;
};

module.exports = {
    newGroup,
    getGroups,
    getGroupData,
    deleteGroup,
    sendMessage
};