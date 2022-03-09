import React from 'react';
import { observer } from 'mobx-react';
import { BrowserRouter as Router, Route, Link as RouterLink, Routes, useParams, useLocation } from "react-router-dom";
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import CampaignIcon from '@mui/icons-material/Campaign';
import './App.css';
import Store from './store';
import GoogleLogin, { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import { runInAction } from 'mobx';
import { AppBar, Box, Container, IconButton, Menu, MenuItem, ThemeProvider, Toolbar, Typography } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

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

const MobxParamSync = observer(({store}: {store: Store}) => {
  const p = useParams();
  const l = useLocation();
  React.useEffect(() => {
    runInAction(() => {
      store.route = {location: l, params: p};
    })
  }, [store, l, p])
  return (<></>);
});

const LoginPage = (props: {
  clientId: string,
  name: string,
  login:(response:GoogleLoginResponse|GoogleLoginResponseOffline) => Promise<void>
}) => (
  <div style={{flex:'1 1 auto', display: 'flex', flexDirection:'column'}}>
    <div className="login-block" style={{flex: '1 1 auto'}}>
      <h1>{props.name} Check In</h1>
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

const MainChrome = observer((props: {
  store: Store,
  children?: React.ReactNode
}) => {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement|null>(null);
  const handleMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => setMenuAnchor(event.currentTarget);
  const handleClose = () => setMenuAnchor(null);
  return (<>
  <MobxParamSync store={props.store} />
  <AppBar>
    <Toolbar>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        {props.store.teamName} Check-In
      </Typography>
      {props.store.user && (
      <div style={{display:'inline-block'}}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={menuAnchor}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(menuAnchor)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => { handleClose(); props.store.doLogout(); }}>Sign Out</MenuItem>
        </Menu>
      </div>)}
    </Toolbar>
  </AppBar>
  <Toolbar />
  <Container style={{flex: '1 1 auto'}}>
    <Box sx={{ my: 2 }}>
      {props.children}
    </Box>
  </Container>
  {/* <OTopBar store={props.store} />
  <div style={{flex:'1 1 auto'}}>
  </div> */}
  <BottomNavigation
    showLabels
    value={props.store.currentSection}
  >
    <BottomNavigationAction component={RouterLink} to="/response" value='response' label="Response" icon={<DirectionsRunIcon />} />
    <BottomNavigationAction component={RouterLink} to="/events" value='events' label="Events" icon={<CampaignIcon />} />
  </BottomNavigation>
</>)
});

function App({store}: {store: Store}) {
  let body;
  if (!store.started) {
    body = (<div>Loading ...</div>);
  } else if (!store.user) {
    body = (<LoginPage clientId={store.config.clientId} login={store.doLogin} name={store.teamName} />);
  } else {
    body = (
      <Router>
        <Routes>
          <Route index element={<MainChrome store={store} />} />
          <Route path="/response/*" element={<MainChrome store={store}>Response Page</MainChrome>} />
          <Route path="/events/*" element={<MainChrome store={store}>Events Page</MainChrome>} />
          {/* <Route index element={<div>body</div>} /> */}
            <Route path="/about" element={<div>The about page</div>} />
          {/* </Route> */}
        </Routes>
      </Router>
    )
  }

  return (
    <ThemeProvider theme={store.theme}>
      {body}
    </ThemeProvider>
  )
}

export default observer(App);
