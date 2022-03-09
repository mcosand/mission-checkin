import axios, { Axios } from 'axios';
import { title } from 'process';
import Member from './models/member';
import MemberGroup from './models/memberGroup';
import SARUnit from './models/sarUnit';

const GROUP_CACHE_AGE_MINS = 5;

interface D4HMember {
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

interface D4HGroup {
  id: number,
  title: string, // "4x4",
  bundle: string, // "Units"
  team: number,
  team_id: number,
  created_at: string,// "2020-09-17T23:08:54.000Z"
  updated_at: string, // "2020-09-17T23:08:54.000Z"
}

class D4HClient {
  d4h: Axios;
  memberCache: { list: D4HMember[], time: number } = { list: [], time: 0 };
  groupsCache: { list: D4HGroup[], time: number } = { list: [], time: 0 };

  constructor(token: string) {
    if (!token) throw new Error('D4H token not specified');

    this.d4h = axios.create({
      baseURL: 'https://api.d4h.org/v2/',
      headers: {
          Authorization: `Bearer ${token}`,
      }
    });
  }

  async getUnits() :Promise<SARUnit[]> {
    const groups = await this.ensureGroups();
    //console.log(groups);
    const units = groups
                    .filter(f => f.bundle == 'Units' && f.title !== 'Unaffiliated')
                    .sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
    return units.map(d4h => ({
      d4hId: d4h.id + '',
      name: d4h.title,
    }));
  }

  async getGroups() :Promise<MemberGroup[]> {
    return (await this.ensureGroups()).map(g => ({
      d4hId: g.id + '',
      name: g.title,
    }));
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


//console.log(matches);

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

  private async ensureGroups() {
    if (new Date().getTime() - GROUP_CACHE_AGE_MINS * 60000 > this.groupsCache.time) {
      this.groupsCache.list = await this.getChunkedList<D4HGroup>('members', 'team/groups');
      this.groupsCache.time = new Date().getTime();
    }
    return this.groupsCache.list;
  }
}

export default D4HClient;