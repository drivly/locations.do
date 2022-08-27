 export default {
  fetch: (req, env) => env.LOCATION.get(env.LOCATION.newUniqueId()).fetch(req)
}

export class Location {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.state.blockConcurrencyWhile(async () => {
      const [cf, locations] = await Promise.all([
       fetch('https://workers.cloudflare.com/cf.json').then(res => res.json()),
       fetch('https://speed.cloudflare.com/locations').then(res => res.json()),
      ])
      this.cf = cf
      this.locations = locations
      this.objects = await env.LOCATIONS.get(env.LOCATIONS.idFromName('index')).fetch('https://locations.do/' + this.cf.colo)
    })
  }
  async fetch(req) {
    const { origin, hostname, pathname, search, searchParams } = new URL(req.url)
    const data = await this.env.LOCATIONS.get(this.env.LOCATIONS.idFromName('index')).fetch('https://locations.do/' + this.cf.colo)
    console.log(this.cf)
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
      objects: this.objects,
      data,
      locations: this.locations,
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
  }
}

export class Locations {
  constructor(state, env) {
    this.state = state
    this.state.blockConcurrencyWhile(async () => {
      this.objects = await this.state.storage.list().then(list => Object.fromEntries(list))
      this.locations = await fetch('https://speed.cloudflare.com/locations').then(res => res.json())
    })
  }
  async fetch(req) {
    const { origin, hostname, pathname } = new URL(req.url)
    const [_,colo] = pathname.split('/')
    const log = await fetch('https://locations.logging.do' + pathname + new URLSearchParams({pathname, colo}).toString())
    console.log({pathname, colo})
    if (!this.objects[colo]) {
      let location = this.locations.find(loc => loc.iata == colo)
      location.url = 'https://locations.do/' + colo
      this.objects[colo] = location
      await this.state.storage.put(colo, location)
      await fetch('https://locations.logging.do' + pathname + new URLSearchParams(location).toString())
    } 
    console.log(this.objects)
    return new Response(JSON.stringify(this.locations, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
  }
}
