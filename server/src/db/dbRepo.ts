import { HostUnitRow } from './hostUnitRow';

export default class DBRepo {
  async getHost(host: string) {
    try {
      return await HostUnitRow.findOne({ where: { siteDomain: host} })
    } catch (ex) {
      console.log('ERROR', ex);
    }
    return undefined;
  }
}