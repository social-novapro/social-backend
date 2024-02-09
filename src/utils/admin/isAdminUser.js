/* checks if user is admin ***TODO: to be updated */
async function isUserAdmin({ adminID }) {
    return { admin: true, adminType: 3 };
    /* will be updated to check once admin is complete */
    const foundUser = await interactAdminSchema.findOne({ userID: adminID })
    if (!foundUser) return { admin: false, error: true };
    return { admin: true, adminType: foundUser.adminType };
}

module.exports = {isUserAdmin};