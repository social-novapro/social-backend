const interactAdminSchema = require("../../schemas/admin/interactAdminSchema");

async function checkUserPerms(userID) {
    const foundPerms = await interactAdminSchema.findOne({_id: userID});
    if (!foundPerms) return {admin: false, adminType: 0};
    else return {admin: true, adminLevel: foundPerms.adminType};
};

module.exports = { checkUserPerms };