import express from "express";
import { createServer } from "node:http";
import { hostname } from "node:os";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { createBareServer } from "@tomphttp/bare-server-node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { bareModulePath } from "@mercuryworkshop/bare-as-module3";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import wisp from "wisp-server-node";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

app.use("/api", async (req, res) => {
  try {
    const upstream = process.env.ORBIT_UPSTREAM; // Example: https://ptza.env.pm/
    const path = req.originalUrl.replace(/^\/api/, ""); // remove /api prefix
    const url = new URL(path, upstream).toString();

    const response = await fetch(url, {
      method: req.method,
      headers: { ...req.headers, host: new URL(upstream).host },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await response.arrayBuffer();
    res.set("Content-Type", response.headers.get("content-type") || "application/json");
    res.status(response.status).send(Buffer.from(data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upstream failed" });
  }
});

app.get("/g", (_, res) => res.sendFile("g.html", { root: "." }));
app.get("/a", (_, res) => res.sendFile("a.html", { root: "." }));
app.get("/s", (_, res) => res.sendFile("s.html", { root: "." }));
app.get("/p", (_, res) => res.sendFile("p.html", { root: "." }));
app.get("/pr", (_, res) => res.sendFile("pr.html", { root: "." }));
app.get("/ai", (_, res) => res.sendFile("ai.html", { root: "." }));
app.get("/mov", (_, res) => res.sendFile("mov.html", { root: "." }));
app.get("/med", (_, res) => res.sendFile("med.html", { root: "." }));
app.get("/music", (_, res) => res.sendFile("music.html", { root: "." }));
app.get("/prx", (_, res) => res.sendFile("prx.html", { root: "." }));
app.get("/mov/", (_, res) => res.sendFile("mov.html", { root: "." }));
app.get("/mov/p", (_, res) => res.sendFile("mov/p.html", { root: "." }));
app.get("/404", (_, res) => res.sendFile("404.html", { root: "." }));

app.use(express.static("."));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use("/bareasmodule/", express.static(bareModulePath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/scram/", express.static("scramjet"));

const bare = createBareServer("/bare/");
const server = createServer();

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else app(req, res);
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else if (req.url.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else socket.end();
});

const port = Number(process.env.PORT) || 8080;
server.listen({ port });

server.on("listening", () => {
  const address = server.address();
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(
    `\thttp://${
      address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  server.close();
  bare.close();
  process.exit(0);
}
