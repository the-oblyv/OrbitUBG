export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.protocol === "http:") {
      url.protocol = "https:"
      return Response.redirect(url.toString(), 301)
    }

    url.hostname = "yewtu.be"

    return fetch(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual"
    })
  }
}
