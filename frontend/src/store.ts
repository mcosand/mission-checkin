// import React from 'react';
// import { useLocalStore } from 'mobx-react';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import { Params } from 'react-router-dom';

interface SiteConfig {
  clientId: string
}

class Store {
  routeParams: Params<string> = {};

  updateRouteParams(p: Readonly<import("react-router").Params<string>>) {
    throw new Error('Method not implemented.');
  }
  @observable started: boolean = false;
  @observable isOnline: boolean = navigator.onLine;
  @observable user?: any;
  @observable loginError?: string;
  @observable units: { id: string, name: string }[] = [];

  @observable config: SiteConfig = { clientId: '' };

  constructor() {
    makeObservable(this);
  }

  async start() {
    window.addEventListener('online', this.setOfflineStatus)
    window.addEventListener('offline', this.setOfflineStatus)
    const response = await (await this.apiFetch('/api/boot')).json()
    runInAction(() => {
      console.log('booting: ', response);

      this.config = response.config as SiteConfig;
      this.user = response.user;
      this.units = response.units;
      this.started = true;

      if (response.siteTeam) {
        document.documentElement.style.setProperty('--brand-background', response.siteTeam.background);
        document.documentElement.style.setProperty('--brand-color', response.siteTeam.color);
      }
    });
  }

  @action.bound
  private setOfflineStatus() {
    this.isOnline = navigator.onLine;
  }

  @action.bound
  async doLogin(loginData:GoogleLoginResponse|GoogleLoginResponseOffline) {
    this.loginError = undefined;

    const isLogin = ((data: GoogleLoginResponse | GoogleLoginResponseOffline) : data is GoogleLoginResponse=> {
      return (data as GoogleLoginResponse).tokenId !== undefined;
    })(loginData);

    if (isLogin) {
      const res = await (await this.apiFetch("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({
          token: loginData.tokenId
        }),
      })).json();

      runInAction(() => {
        if (res.error) {
          this.loginError = res.error;
          this.user = undefined;
          alert(this.loginError);
        } else {
          console.log('Logging in', res);
          this.user = res
        }
      });
    }
  }

  @action.bound
  async doLogout() {
    if (!this.user) return;
    
    await this.apiFetch('/api/auth/logout', {
      method: 'POST',
      mode: 'same-origin', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify({})
    });

    runInAction(() => this.user = undefined);
  }

  private apiFetch(url: string, config?: RequestInit) {
    return fetch(url, {
      method: "GET",
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...config?.headers
      },
    })
  }
}

 export default Store;

// const storeContext = React.createContext<TStore | null>(null);

// export const StoreProvider = ({ store, children }: { store?: Store, children: any }) => {
//   const localStore = useLocalStore(() => store ?? new Store());
//   return (<storeContext.Provider value={localStore as any}>{children}</storeContext.Provider>);
// }

// export const useStore = () => {
//   const store = React.useContext(storeContext)
//   if (!store) {
//     // this is especially useful in TypeScript so you don't need to be checking for null all the time
//     throw new Error('useStore must be used within a StoreProvider.')
//   }
//   return store
// }