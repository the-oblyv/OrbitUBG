import { createProxyMiddleware } from "ultraviolet"

export const config = {
  runtime: "edge"
}

export default createProxyMiddleware({
  target: "https://ultraviolet.how",
  changeOrigin: true,
  pathRewrite: (path) => path.replace(/^\/api\/uv/, ""),
})
