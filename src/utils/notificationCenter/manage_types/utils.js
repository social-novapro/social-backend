/* takes any string and replaces placeholders with the appropriate values (specifically for notif_types) */
function updateStringLayout({ string, userData, postData }) {
    if (!string) return string;
    var newString = string;

    const placeholders = {
        "[username]": userData?.username,
        "[user_tag]": `@${userData?.username}`,
        "[post_content]": postData?.content,
        "[user_url]": `https://interact.novapro.net/?username=${userData?.username}`,
        "[post_url]": `https://interact.novapro.net/?postID=${postData?._id}`,
        // Add more placeholders as needed
    };
    
    for (const [placeholder, value] of Object.entries(placeholders)) {
        if (newString.includes(placeholder)) {
            newString = newString.replace(placeholder, value);
        }
    }

    return newString;
}

module.exports = {
    updateStringLayout
};