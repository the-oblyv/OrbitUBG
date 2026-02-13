const baseProxy = "https://3.dmvdriverseducation.org/vpr/go/";
const iframe = document.getElementById("proxyFrame");
const input = document.getElementById("proxyInput");
const goBtn = document.getElementById("goBtn");

function encodeUrl(url) {
    try {
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }
        return encodeURIComponent(url);
    } catch (e) {
        return encodeURIComponent("https://start.duckduckgo.com/");
    }
}

let queryUrl = decodeURIComponent(location.search.slice(1));
if (!queryUrl) queryUrl = "https://start.duckduckgo.com/";

iframe.src = baseProxy + encodeUrl(queryUrl);
input.value = queryUrl;

goBtn.addEventListener("click", () => {
    let target = input.value.trim();
    iframe.src = baseProxy + encodeUrl(target);
});

input.addEventListener("keydown", e => {
    if (e.key === "Enter") goBtn.click();
});
