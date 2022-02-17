import express from 'express';
import session from 'express-session';

import axios from 'axios';
import path from 'path';

declare module 'express-session' {
  interface SessionData {
    auth: {
      email: string,
      hd: string,
      picture?: string,
      name?: string,
      given_name?: string,
      family_name?: string,
    }
  }
}

const app = express();
const port = 5021; // default port to listen

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'psw8e56b9vqpe956qbt',
  resave: true,
  name:'session',
  saveUninitialized:false,
}))

app.post('/api/login', (req, res) => {
  const data = req.body;
  if (!data.userToken) {
    res.status(400).json({ error: 'must specify userToken' })
  }

  (async () => {
    const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${data.userToken}`);
    console.log(googleResponse.data);
    if (googleResponse.data.email && googleResponse.data.hd) {
      req.session.auth = googleResponse.data;
    }
    res.send({loggedIn: 'OK'});
  })();
});

app.post('/api/logout', (req, res) => {
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