const interactAdminIndexSchema = require("../../../schemas/admin/interactAdminIndexSchema");

async function createAdminIndex({ name }) {
    await interactAdminIndexSchema.create({ _id: name ? name : "main" });
}
async function getAdminIndex({ name }) {
    const foundIndexes = await interactAdminIndexSchema.findOne({_id: name ? name : "main" });
    return foundIndexes;
}

async function getCurrentErrorIndex() {
    const foundIndex = await interactAdminIndexSchema.findOne({ _id: "main" });
    if (!foundIndex || !foundIndex.issueErrorIndex) return null;

    return foundIndex.issueErrorIndex;
}

async function setCurrentErrorIndex({ indexID }) {
    const found = await getAdminIndex({});
    if (!found) await createAdminIndex({});
    
    await interactAdminIndexSchema.findOneAndUpdate({
        _id: "main",
    }, {
        issueErrorIndex: indexID
    })
}

module.exports = { 
    getCurrentErrorIndex, setCurrentErrorIndex 
};
