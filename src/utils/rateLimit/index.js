function createRateLimiter({ windowMs, max, name }) {
    const hits = new Map();
    let requestCount = 0;

    return function rateLimit(req, res, next) {
        if (req.method === 'OPTIONS') return next();

        const now = Date.now();
        requestCount += 1;

        if (requestCount % 1000 === 0) {
            for (const [hitKey, hitData] of hits.entries()) {
                if (hitData.resetAt <= now) hits.delete(hitKey);
            }
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const key = `${name}:${ip}`;
        const current = hits.get(key);

        if (!current || current.resetAt <= now) {
            hits.set(key, {
                count: 1,
                resetAt: now + windowMs
            });
            return next();
        }

        current.count += 1;

        if (current.count > max) {
            const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
            res.set('Retry-After', String(retryAfterSeconds));
            return res.status(429).send({
                error: true,
                code: 'RATE_LIMITED',
                msg: 'Too many requests, please try again later.',
                retryAfterSeconds
            });
        }

        hits.set(key, current);
        return next();
    };
}

module.exports = { createRateLimiter };
