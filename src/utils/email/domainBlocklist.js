const blockedDomains = require('./domainBlocklist.json');

function getEmailDomain(email) {
    if (!email || typeof email !== 'string') return null;

    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) return null;

    return parts[1];
}

function checkBlockedEmailDomain({ email, userID=null }) {
    const domain = getEmailDomain(email);
    if (!domain) return { blocked: false };

    const blocked = blockedDomains.some((blockedDomain) => domain === blockedDomain || domain.endsWith(`.${blockedDomain}`));
    if (!blocked) return { blocked: false };

    return {
        blocked: true,
        domain,
        error: {
            code: 'EMAIL_DOMAIN_BLOCKED',
            msg: 'Email domain is blocked.',
            userID,
            error: true
        }
    };
}

module.exports = { checkBlockedEmailDomain, getEmailDomain };
