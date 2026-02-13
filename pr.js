const proxyBase = "https://3.dmvdriverseducation.org/vpr/go/"; 
const iframe = document.getElementById("proxyFrame");

function getTargetUrl() {
    const query = window.location.href.split("?")[1];
    if (query) return encodeURIComponent(query);
    return encodeURIComponent("https://start.duckduckgo.com/");
}

iframe.src = proxyBase + getTargetUrl();
