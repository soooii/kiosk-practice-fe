import { defineConfig, loadEnv } from 'vite';
import { createAiMiddleware } from './server/ai.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'OPENAI_');
  const install = (server) => { server.middlewares.use(createAiMiddleware({ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL })); };
  return { plugins: [{ name: 'kiosk-ai', configureServer: install, configurePreviewServer: install }] };
});
