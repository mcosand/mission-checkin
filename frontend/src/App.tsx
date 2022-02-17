import React from 'react';
import { observer } from 'mobx-react';
import { BrowserRouter as Router, Route, Link, Routes, Outlet } from "react-router-dom";
import './App.css';
import Store from './store';

function TopBar({online, user, logout}: {online:boolean, user: any, logout: () => Promise<void>}) {
  if (online) {
    console.log('user', user ? JSON.parse(JSON.stringify(user)) : undefined)
    return (<div>
      {user ? 'Logged in' : 'Logged out'}
      {user
      ? <button onClick={() => logout()}>Logout</button>
      : <div>Login UI: {process.env.REACT_APP_AUTH_CLIENT} </div>
      }
    </div>);
  } else {
    return (<div>you are offline</div>);
  }
}

function App({store}: {store: Store}) {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>
          <TopBar online={store.isOnline} user={store.user} logout={store.doLogout} />
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
