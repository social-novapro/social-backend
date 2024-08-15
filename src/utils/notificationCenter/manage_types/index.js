const interactNotificationCenterTypeSchema = require('../../../schemas/notificationCenter/interactNotificationCenterTypeSchema');
const { checktime } = require('../../checktime');
const notif_types = require('../notif_types.json');

async function updateNotifTypesDB() {
    for (const type of notif_types.types) {
        // console.log(type)

        const foundType = await findNotifTypeData({type: type.id});
        // console.log(foundType)

        const isSameType = isSameJsonToMongoType(type, foundType);

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
            // pushToSystem: type.pushToSystem
            
        });

        if (type.pushToSystem?.length > 0) {
            for (const system of type.pushToSystem) {
                await interactNotificationCenterTypeSchema.findOneAndUpdate({
                    _id: type.id
                }, {
                    $push: {
                        pushToSystem: {
                            _id: system.id,
                            content: system.content,
                            subject: system.subject,
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

        console.log(`Type ${type.id} updated`)
    }
}

function isSameJsonToMongoType(jsonType, mongoType) {
    if (jsonType.id !== mongoType._id) return false;
    if (jsonType.name !== mongoType.name) return false;
    if (jsonType.description !== mongoType.description) return false;

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