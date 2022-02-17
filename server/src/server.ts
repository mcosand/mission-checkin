import express from 'express';
import session, { SessionData } from 'express-session';
import { config as configEnv } from 'dotenv';
import path from 'path';

import D4HClient from './d4h';

import { OAuth2Client, TokenPayload } from 'google-auth-library';

configEnv({path: './.env.local'});

interface AuthData extends TokenPayload {
  email: string,
  d4hId?: string,
}
declare module 'express-session' {
  interface SessionData {
    auth: AuthData
  }
}

console.log('Auth ClientID: ', process.env.AUTH_CLIENT)
const authClient = new OAuth2Client(process.env.AUTH_CLIENT)
const d4hClient = new D4HClient(process.env.D4H_TOKEN)

const app = express();
const port = 5021; // default port to listen

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'psw8e56b9vqpe956qbt',
  resave: true,
  name:'session',
  saveUninitialized:false,
}))

function userFromAuth(ticket?: AuthData) {
  if (!ticket) return undefined;

  return {
    name: ticket.name,
    email: ticket.email,
    domain: ticket.hd,
    picture: ticket.picture,
    //d4hId: ticket.d4hId,
  }
}

app.get('/api/boot', (req, res) => {
  res.json({
    user: userFromAuth(req.session.auth),
    config: { clientId: process.env.AUTH_CLIENT }
  })
})

app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;
  const ticket = await authClient.verifyIdToken({
    idToken: token,
    audience: process.env.CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (process.env.ALLOWED_DOMAINS.split(',').indexOf(payload.hd) < 0) {
    console.log(`${payload.email} from domain ${payload.hd} not allowed`)
    res.status(403).json({error: 'User not from allowed Google domain' })
    return
  }

  const member = await d4hClient.getMemberFromEmail(payload.email);

  req.session.auth = {
    email: '',
    ...payload,
    d4hId: member.d4hId,
  };
  console.log(`Logged in ${payload.email} D4H:${member.d4hId}`);
  res.status(200);
  res.json(userFromAuth(req.session.auth));
})

app.post('/api/auth/logout', (req, res) => {
  req.session?.destroy(err => {
    if (err) {
      res.status(400).json({ error: 'Unable to log out' })
    } else {
      res.json({ msg: 'Logout successful' })
    }
  });
})

app.get('/api/me', (req, res) => {
  if (!req.session.auth) {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  console.log('API ME', req.session);
  res.send({some:'data', picture:req.session.auth?.picture})
})

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