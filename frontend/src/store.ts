import { action, makeObservable, observable, runInAction } from 'mobx';
class Store {
  @observable isOnline: boolean = navigator.onLine;
  @observable user?: any;

  constructor() {
    makeObservable(this);
  }

  start() {
    window.addEventListener('online', this.setOfflineStatus)
    window.addEventListener('offline', this.setOfflineStatus)
  }

  @action.bound
  private setOfflineStatus() {
    this.isOnline = navigator.onLine;
  }

  @action.bound
  private async onSigninComplete(ev: any) {
  }

  @action.bound
  async doLogout() {
  }
}

export default Store;