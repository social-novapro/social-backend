const interactAdminIndexSchema = require("../../../schemas/admin/interactAdminIndexSchema");
const { checktime } = require("../../checktime");

/* creates a new index group */
async function createAdminIndex({ name }) {
    await interactAdminIndexSchema.create({ _id: name ? name : "main", timestamp: checktime() });
}

/* gets the index group */
async function getAdminIndex({ name }) {
    const foundIndexes = await interactAdminIndexSchema.findOne({_id: name ? name : "main" });
    return foundIndexes;
}

/* gets the error index from group */
async function getCurrentErrorIndex() {
    const foundIndex = await interactAdminIndexSchema.findOne({ _id: "main" });

    // cant have error, will circular dependancy
    if (!foundIndex || !foundIndex.issueErrorIndex) return null;

    return foundIndex.issueErrorIndex;
}

/* sets the error index to group */
async function setCurrentErrorIndex({ indexID }) {
    const found = await getAdminIndex({ name: "main" });
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
