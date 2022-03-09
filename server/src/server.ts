import express from 'express';
import session from 'express-session';
import { config as configEnv } from 'dotenv';
import path from 'path';

import D4HClient from './d4h';

import { OAuth2Client, TokenPayload } from 'google-auth-library';
import DBRepo from './db/dbRepo';
import { sequelize } from './db/dbBuilder';
import { addAccountApi } from './api/accountApi';

configEnv({path: './.env.local'});

declare module 'express-session' {
  interface SessionData {
    auth: AuthData
  }
}

export interface AuthData extends TokenPayload {
  email: string,
  d4hId?: string,
}
export function userFromAuth(ticket?: AuthData) {
  if (!ticket) return undefined;

  return {
    name: ticket.name,
    email: ticket.email,
    domain: ticket.hd,
    picture: ticket.picture,
    //d4hId: ticket.d4hId,
  }
}

async function boot() {
  console.log('Auth ClientID: ', process.env.AUTH_CLIENT)
  const authClient = new OAuth2Client(process.env.AUTH_CLIENT)
  const d4hClient = new D4HClient(process.env.D4H_TOKEN)

  if (!process.env.DB_HOST) await sequelize.sync();
  const db = new DBRepo();

  const app = express();
  const port = 5021; // default port to listen

  app.use(express.json());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'psw8e56b9vqpe956qbt',
    resave: true,
    name:'session',
    saveUninitialized:false,
  }))

  app.get('/api/boot', async (req, res) => {
    const siteDomain = ((req.headers['x-forwarded-host'] ?? req.headers['host']) as string).split(':')[0];
    const hostRow = await db.getHost(siteDomain);
    res.json({
      siteTeam: hostRow ? { name: hostRow.name, color: hostRow.color, background: hostRow.background } : undefined,
      user: userFromAuth(req.session.auth),
      config: { clientId: process.env.AUTH_CLIENT },
      units: await d4hClient.getUnits()
    })
  });

  addAccountApi(app, authClient, d4hClient);


  ;[
    '/favicon.ico',
    '/logo192.png',
    '/manifest.json',
    '/robots.txt',
    '/service-worker.js',
    '/static'
  ].forEach(p => app.use(p, express.static(path.join(__dirname, `../../frontend/build${p}`))));

  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/build', 'index.html'));
  });

  // start the Express server
  app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
  });
}
boot();