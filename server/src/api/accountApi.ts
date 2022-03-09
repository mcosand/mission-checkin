import { Express } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { userFromAuth } from '../server';
import D4HClient from '../d4h';

export function addAccountApi(app: Express, authClient: OAuth2Client, d4hClient: D4HClient) {
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
  // console.log('API ME', req.session);
    res.send({some:'data', picture: req.session.auth?.picture})
  })
}