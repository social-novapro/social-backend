
async function checkIfPinned({ pinsFound, postID }) {
    if (!pinsFound || !pinsFound[0]) return false;
    if (!postID) return false;
    for (const pin of pinsFound) {
        if (pin._id === postID) return true;
    }
    return false;
}

module.exports = { checkIfPinned }