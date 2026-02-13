const proxyBase = "https://3.dmvdriverseducation.org/vpr/go/";
const iframe = document.getElementById("proxyFrame");

function getTargetUrl() {
    const params = new URLSearchParams(window.location.search);
    const query = window.location.href.split("?")[1];
    if (query) return query;
    return "https://start.duckduckgo.com/";
}

iframe.src = proxyBase + getTargetUrl();
