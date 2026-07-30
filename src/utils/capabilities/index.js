const REQUEST_TIMEOUT_MS = Number(process.env.CAPABILITY_REQUEST_TIMEOUT_MS || 3000);

const definitions = {
    ai: { env: 'AI_INTERFACE_SERVICE', proxyPath: '/v1', healthPath: '/v1/serverStatus' },
    embeddings: { env: 'EMBED_API_DEV_ROUTE', healthPath: '/test' },
    media: { env: 'CDN_SERVICE', proxyPath: '/v1', healthPath: '/v1/serverStatus' },
    video: { env: 'VIDEO_EMBED' }
};

const states = new Map();

function endpoint(name) {
    return process.env[definitions[name].env] || null;
}

function setState(name, state, reason = null) {
    states.set(name, { state, reason, updatedAt: Date.now() });
}

function ensureState(name) {
    if (!states.has(name)) setState(name, endpoint(name) ? 'unknown' : 'unavailable', endpoint(name) ? null : 'unconfigured');
    return states.get(name);
}

function snapshot() {
    return Object.fromEntries(Object.keys(definitions).map((name) => [name, ensureState(name).state]));
}

function proxyTarget(name) {
    const value = endpoint(name);
    if (!value) return null;
    return `${value.replace(/\/$/, '')}${definitions[name].proxyPath || ''}`;
}

function unavailable(res, capability) {
    return res.status(503).json({
        error: {
            code: 'CAPABILITY_UNAVAILABLE',
            capability,
            message: 'This capability is temporarily unavailable.',
            retryable: true
        }
    });
}

async function probe(name) {
    const value = endpoint(name);
    const healthPath = definitions[name].healthPath;
    if (!value) return setState(name, 'unavailable', 'unconfigured');
    if (!healthPath) return ensureState(name);

    let healthURL;
    try {
        healthURL = new URL(healthPath, value).toString();
    } catch {
        return setState(name, 'unavailable', 'unconfigured');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, 1000));
    try {
        const response = await fetch(healthURL, { signal: controller.signal });
        setState(name, response.ok ? 'available' : 'unavailable', response.ok ? null : 'unhealthy');
    } catch (error) {
        setState(name, 'unavailable', error.name === 'AbortError' ? 'timeout' : 'connection_error');
    } finally {
        clearTimeout(timer);
    }
}

function startProbes() {
    const probeAll = () => Promise.all(Object.keys(definitions).map(probe)).catch(() => {});
    probeAll();
    return setInterval(probeAll, Number(process.env.CAPABILITY_PROBE_INTERVAL_MS || 30000));
}

function recordSuccess(name) { setState(name, 'available'); }
function recordFailure(name, reason = 'connection_error') { setState(name, 'unavailable', reason); }

module.exports = { REQUEST_TIMEOUT_MS, snapshot, proxyTarget, unavailable, startProbes, recordSuccess, recordFailure };
