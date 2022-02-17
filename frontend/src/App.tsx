import React from 'react';
import { observer } from 'mobx-react';
import { BrowserRouter as Router, Route, Link, Routes, Outlet } from "react-router-dom";
import './App.css';
import Store from './store';
import GoogleLogin, { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

function TopBar({online, user, clientId, login, logout}: {
  online:boolean,
  user: any,
  clientId: string,
  login: (response:GoogleLoginResponse|GoogleLoginResponseOffline) => Promise<void>,
  logout: () => Promise<void>
}) {
  if (online) {
    return (<div>
      {user ? 'Logged in' : 'Logged out'}
      {user
      ? <button onClick={() => logout()}>Logout</button>
      : <GoogleLogin
          clientId={clientId}
          buttonText="Log in with Google"
          onSuccess={login}
          onFailure={login}
          cookiePolicy={'single_host_origin'}
        />
      }
    </div>);
  } else {
    return (<div>you are offline</div>);
  }
}

function App({store}: {store: Store}) {
  if (!store.started) return (<div>Loading ...</div>);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>
          <TopBar
            online={store.isOnline}
            clientId={store.config.clientId}
            user={store.user}
            login={store.doLogin}
            logout={store.doLogout}
            />
          <div><Outlet /></div>
          </div>}>
          <Route index element={<div>Home page</div>} />
          <Route path="/about" element={<div>The about page</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default observer(App);
