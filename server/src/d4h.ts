import axios, { Axios } from 'axios';
import Member from './models/member';

export interface D4HMember {
  id: number,
  ref?: string,
  name: string,
  email?: string,
  status: { id: number, type: string },
  urls: { image?: string },
  custom_fields: [{
    id: number,
    label: string,
    value: any
  }],
}

class D4HClient {
  d4h: Axios;
  memberCache: { list: D4HMember[] } = { list: [] };

  constructor(token: string) {
    if (!token) throw new Error('D4H token not specified');

    this.d4h = axios.create({
      baseURL: 'https://api.d4h.org/v2/',
      headers: {
          Authorization: `Bearer ${token}`,
      }
    });
  }

  async getMemberFromEmail(email: string) :Promise<Member|undefined> {
    if (this.memberCache.list.length === 0) {
      const members = await this.getChunkedList<D4HMember>('members', 'team/members?include_details=true&include_custom_fields=true');
      this.memberCache.list = members;
    }

    const matches = this.memberCache.list.filter(m => {
      if (m.email === email) return true;

      const emailsText = this.getMemberSecondaryEmails(m);
      const matching = emailsText?.split(',')?.map(e => e.trim()).find(e => e === email);
      return !!matching;
    })


console.log(matches);

    if (matches.length === 1) {
      return {
        d4hId: matches[0].id + '',
        name: matches[0].name,
        status: matches[0].status.type,
        emails: [ matches[0].email, ...this.getMemberSecondaryEmails(matches[0]) ],
      };
    }

    return undefined;
  }

  private getMemberSecondaryEmails(m: D4HMember) :string|undefined {
    return m.custom_fields.find(f => f.label === 'Secondary Email')?.value as string|undefined;
  }

  private async getChunkedList<T>(name: string, url: string) {
    let list : T[]= [];
    let chunk = [];
    do {
      chunk = (await this.d4h.get(`${url}${url.includes('?') ? '&' : '?'}limit=250&offset=${list.length}`)).data.data;
      list = [ ...list, ...chunk ];
      console.log(`${name}: ${list.length}`);
    } while (chunk.length >= 250);
  
    return list;
  }
}

export default D4HClient;