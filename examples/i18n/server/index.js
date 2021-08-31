import express from "express";
import vitePluginSsr from "vite-plugin-ssr";
import vite from "vite";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { extractLocale } from '../locales/index.js'
const { createPageRender } = vitePluginSsr;
const __dirname = dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === "production";
const root = `${__dirname}/..`;

startServer();

async function startServer() {
  const app = express();

  let viteDevServer;
  if (isProduction) {
    app.use(express.static(`${root}/dist/client`, { index: false }));
  } else {
    viteDevServer = await vite.createServer({
      root,
      server: { middlewareMode: true },
    });
    app.use(viteDevServer.middlewares);
  }

  const renderPage = createPageRender({ viteDevServer, isProduction, root });
  app.get("*", async (req, res, next) => {
    let url = req.originalUrl

    const { urlWithoutLocale, locale } = extractLocale(url)
    url = urlWithoutLocale

    const pageContext = {
      url,
      locale
    }

    const result = await renderPage(pageContext);
    if (result.nothingRendered) return next();
    res.status(result.statusCode).send(result.renderResult);
  });

  const port = 3000;
  app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}
