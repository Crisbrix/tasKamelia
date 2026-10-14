import { app, ready } from '../server/src/app.js';

export default async function handler(req, res) {
  await ready;
  return app(req, res);
}
