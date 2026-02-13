const baseProxy = "https://3.dmvdriverseducation.org/vpr/go/";
const iframe = document.getElementById("proxyFrame");
const input = document.getElementById("proxyInput");
const goBtn = document.getElementById("goBtn");

function encodeUrl(url) {
    return encodeURIComponent(url);
}

let url = location.search.slice(1);

if (!url) {
    url = "https://start.duckduckgo.com/";
}

iframe.src = baseProxy + encodeUrl(url);
input.value = url;

goBtn.addEventListener("click", () => {
    let target = input.value.trim();
    if (!target.startsWith("http")) target = "https://" + target;
    iframe.src = baseProxy + encodeUrl(target);
});

input.addEventListener("keydown", e => {
    if (e.key === "Enter") goBtn.click();
});
