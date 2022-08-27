 export default {
  fetch: (req, env) => env.LOCATION.get(env.LOCATION.newUniqueId()).fetch(req)
}

export class Location {
  constructor(state, env) {
    this.state = state
    this.state.blockConcurrencyWhile(async () => {
      this.cf = await fetch('https://workers.cloudflare.com/cf.json').then(res => res.json())
      this.locations = await fetch('https://speed.cloudflare.com/locations').then(res => res.json())
    })
  }
  async fetch(req) {
    const { origin, hostname, pathname, search, searchParams } = new URL(req.url)
    const api = {
      icon: '🌎',
      name: 'Locations.do',
      description: 'Durable Object Locations',
      url: 'https://locations.do',
      endpoints: {
        listLocations: origin + '/api',
        getLocation: origin + '/api/:location',
      },
      memberOf: 'https://primitives.do',
    }
    return new Response(JSON.stringify({ 
      api,
      logged,
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
  }
}

export class Locations {
  constructor(state, env) {
    this.state = state
    this.state.blockConcurrencyWhile(async () => {
      this.locations = await this.state.storage.list().then(list => Object.fromEntries(list))
    })
  }
  async fetch(req) {
    const { origin, hostname, pathname } = new URL(req.url)
    const [_,location,id] = pathname.split('/')
    return new Response(JSON.stringify({ 
      api,
      logged,
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
  }
}
