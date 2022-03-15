fetch('/apiDocs').then(response => response.json()).then(data => {
    buildView(data);
});

function buildView(data) {
    const v1Api = data.v1;
    document.getElementById("populate").innerHTML = `
        <p>Current API Version: ${data.currentAPI}</p>
        <div id="apiVersions"> 
            <h1>API v1 Documentation</h1>
            <p>Base Url: ${v1Api.BASEURL}</p>
            <p>Auth Headers: App Token</p>
            <div> 
                <h1>Methods</h1>
                <h3>GET -- ${v1Api.GET.BaseMethodURL.replace('(BASEURL)', v1Api.BASEURL)}</h3>
                <p>${getMethods(v1Api.GET.BaseMethodURL.replace('(BASEURL)', v1Api.BASEURL), v1Api.GET.methods)}<p>
            </div>
        </div>
    `;
};

function getMethods(BaseURL, methods) {
    var dataParsed ='';

    for (const method of methods) {
        const name = method.n ;
        const data = method.d;
        const url = method.u.replace('(BaseMethodURL)', BaseURL);
        const headers = method.h.join(', ');

        dataParsed += `
            <div>
                <p><b>Name: ${name}</b></p>
                <p>Data callback: ${data}</p>
                <p>URL: ${url}</p>
                <p>Headers: ${headers}</p>
            </div>
        `;
    };

    return dataParsed;
};