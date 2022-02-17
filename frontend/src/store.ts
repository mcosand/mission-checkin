import { action, makeObservable, observable, runInAction } from 'mobx';
import { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

interface SiteConfig {
  clientId: string
}

class Store {
  @observable started: boolean = false;
  @observable isOnline: boolean = navigator.onLine;
  @observable user?: any;
  @observable loginError?: string;

  @observable config: SiteConfig = { clientId: '' };

  constructor() {
    makeObservable(this);
  }

  async start() {
    window.addEventListener('online', this.setOfflineStatus)
    window.addEventListener('offline', this.setOfflineStatus)
    const response = await (await this.apiFetch('/api/boot')).json()
    runInAction(() => {
      this.config = response.config as SiteConfig;
      this.user = response.user;
      this.started = true;
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