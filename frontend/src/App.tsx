import React from 'react';
import { observer } from 'mobx-react';
import { BrowserRouter as Router, Route, Link, Routes, Outlet, useParams } from "react-router-dom";
import './App.css';
import Store from './store';
import GoogleLogin, { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import { storeAnnotation } from 'mobx/dist/internal';

function TopBar({online, user, clientId, login, logout}: {
  online:boolean,
  user: any,
  clientId: string,
  login: (response:GoogleLoginResponse|GoogleLoginResponseOffline) => Promise<void>,
  logout: () => Promise<void>
}) {
  if (online) {
    return (<div id="blah" style={{ color:'var(--brand-color)', backgroundColor:'var(--brand-background)'}}>
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

const OTopBar = observer(({store}: {store: Store}) => (
  <TopBar
    online={store.isOnline}
    clientId={store.config.clientId}
    user={store.user}
    login={store.doLogin}
    logout={store.doLogout}
  />
));

const MobxParamSync = ({store}: {store: Store}) => {
  const p = useParams();
  console.log('Sending params', p);
  store.routeParams = p;
  return (<></>);
}

const LoginPage = (props: {
  clientId: string,
  login:(response:GoogleLoginResponse|GoogleLoginResponseOffline) => Promise<void>
}) => (
  <div style={{flex:'1 1 auto', display: 'flex', flexDirection:'column'}}>
    <div className="login-block" style={{flex: '1 1 auto'}}>
      <h1>Team Check In</h1>
      <GoogleLogin
          clientId={props.clientId}
          buttonText="Log in with Google"
          onSuccess={props.login}
          onFailure={props.login}
          cookiePolicy={'single_host_origin'}
        />
    </div>
  </div>
);

function App({store}: {store: Store}) {
  if (!store.started) return (<div>Loading ...</div>);
  if (!store.user) return (<LoginPage clientId={store.config.clientId} login={store.doLogin} />);
  return (
    <Router>
      <Routes>
        <Route path="/" element={MobxParamSync} />
        {/* <Route path="/" element={<div>
          <TopBar
            online={store.isOnline}
            clientId={store.config.clientId}
            user={store.user}
            login={store.doLogin}
            logout={store.doLogout}
            />
          <div><Outlet /></div>
          </div>}> */}
          <Route index element={<><MobxParamSync store={store}/><OTopBar store={store} /></>} />
          <Route path="/about" element={<div>The about page</div>} />
        {/* </Route> */}
      </Routes>
    </Router>
  );
}

export default observer(App);
