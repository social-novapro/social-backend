const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const { checktime } = require('../../checktime');
const notif_types = require('../notif_types.json');

async function updateNotifTypesDB() {
    if (!notif_types.types) return console.log("No types found in notif_types.json");
    
    // will make sure the ids are all there, figure out which ones to delete
    const mongoTypes = await interactNotificationCenterTypeSchema.find();
    for (const mongoType of mongoTypes) {
        const foundType = notif_types.types.find(type => type.id === mongoType._id);
        if (!foundType) {
            console.log(`Deleted type ${mongoType._id}, not found in json`)
            await interactNotificationCenterTypeSchema.findOneAndDelete({ _id: mongoType._id });
        }
    }

    // checks json file for types
    for (const type of notif_types.types) {
        const foundType = await findNotifTypeData({type: type.id});
        // console.log(foundType)
        if (type.esstential === undefined) type.esstential = false;

        const isSameType = isSameJsonToMongoType(type, foundType);

        // console.log(`Checking type ${type.id}`)
        // console.log(`isSameType: ${isSameType}`)
        // console.log(`foundType: ${foundType.essential}`)
        // console.log(`jsonType: ${type.esstential ? type.esstential : false}`)
        // no update needed
        if (isSameType) {
            // console.log(`Type ${type.id} is the same`)
            continue;
        }

        // update needed on type
        if (foundType && !isSameType) {
            console.log(`Deleted type ${type.id}, will update`)
            await interactNotificationCenterTypeSchema.findOneAndDelete({ _id: type.id });
        }

        await interactNotificationCenterTypeSchema.create({
            _id: type.id,
            name: type.name,
            timestamp: checktime(),
            description: type.description,
            esstential: type.esstential,
        });

        if (type.pushToSystem?.length > 0) {
            for (const system of type.pushToSystem) {
                await interactNotificationCenterTypeSchema.findOneAndUpdate({
                    _id: type.id
                }, {
                    $push: {
                        pushToSystem: {
                            _id: system.id,
                            subject: system.subject,
                            content: system.content,
                            htmlP: system.htmlP,
                            htmlA: system.htmlA,
                            title: system.title,
                            subtitle: system.subtitle,
                            body: system.body
                        }
                    }
                })
            }
        } else {
            console.log(`No system data for notification id type ${type.id}`)
        }

        console.log(`Type ${type.id} ${foundType ? "updated" : "created"}`);
    }
}

function isSameJsonToMongoType(jsonType, mongoType) {
    if (!jsonType) return false; // make sure it exists
    if (!mongoType) return false; // make sure it exists
    if (mongoType.esstential === null) return false; // legacy check
    if (jsonType.id !== mongoType._id) return false;
    if (jsonType.name !== mongoType.name) return false;
    if (jsonType.description !== mongoType.description) return false;
    if (jsonType.esstential !== mongoType.esstential) return false;

    // probably overcomplicated
    // this makes sure that
    // if jsonArray doesnt exist, but mongoArray isnt 0, return false - makes sure it wont do loops later
    // or if jsonArray exists, and mongoArray isnt the same length as jsonArray return false
    if ((!jsonType.pushToSystem && mongoType.pushToSystem?.length != 0) ||
        ((jsonType.pushToSystem) && jsonType.pushToSystem.length !== mongoType.pushToSystem?.length)
    ) return false;

    if (jsonType.pushToSystem?.length > 0 || mongoType.pushToSystem?.length > 0) {
        const lengthUse = jsonType.pushToSystem.length > mongoType.pushToSystem.length ? jsonType.pushToSystem.length : mongoType.pushToSystem.length;
        for (let i = 0; i < lengthUse; i++) {
            if (!jsonType.pushToSystem[i] || !mongoType.pushToSystem[i]) return false;
            const system1 = jsonType.pushToSystem[i];
            const system2 = mongoType.pushToSystem[i];
    
            if (system1.id !== system2._id) return false;
            if (system1.content !== system2.content) return false;
            if (system1.subject !== system2.subject) return false;
            if (system1.htmlP !== system2.htmlP) return false;
            if (system1.htmlA !== system2.htmlA) return false;
            if (system1.title !== system2.title) return false;
            if (system1.subtitle !== system2.subtitle) return false;
            if (system1.body !== system2.body) return false;
        }
    }

    return true;
}

async function findNotifTypeData({type}) {
    return await interactNotificationCenterTypeSchema.findOne({ _id: type });
};

module.exports = { updateNotifTypesDB, findNotifTypeData };