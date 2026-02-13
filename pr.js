const baseProxy = "https://3.dmvdriverseducation.org/vpr/go/";
const input = document.getElementById("proxyInput");
const goBtn = document.getElementById("goBtn");

function encodeUrl(url) {
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return encodeURIComponent(url);
}

let queryUrl = decodeURIComponent(location.href.split('?')[1] || "");

input.value = queryUrl;

window.location.href = baseProxy + encodeUrl(queryUrl);

goBtn.addEventListener("click", () => {
    let target = input.value.trim();
    if (!target) return;
    window.location.href = baseProxy + encodeUrl(target);
});

input.addEventListener("keydown", e => {
    if (e.key === "Enter") goBtn.click();
});
