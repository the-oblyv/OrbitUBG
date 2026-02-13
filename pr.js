const baseProxy = "https://3.dmvdriverseducation.org/vpr/go/";
const iframe = document.getElementById("proxyFrame");
const input = document.getElementById("proxyInput");
const goBtn = document.getElementById("goBtn");

function encodeUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }
    return encodeURIComponent(url);
}

let rawQuery = location.href.split('?')[1] || "";
rawQuery = decodeURIComponent(rawQuery);

let initialUrl = rawQuery || "https://start.duckduckgo.com/";

iframe.src = baseProxy + encodeUrl(initialUrl);
input.value = initialUrl;

goBtn.addEventListener("click", () => {
    let target = input.value.trim();
    if (!target) return;
    iframe.src = baseProxy + encodeUrl(target);
});

input.addEventListener("keydown", e => {
    if (e.key === "Enter") goBtn.click();
});
