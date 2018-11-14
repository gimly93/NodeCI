const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget)
const exac = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
  if(!this.useCache){
    return exac.apply(this, arguments)
  }
  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }))

  const cacheValue = await client.hget(this.hashKey, key)
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc)
  }

  const result = await exac.apply(this, arguments);
  client.hset(this.hashKey, key, JSON.stringify(result),'EX', 100)
  return result;

}

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}

module.exports = {
  clearHash(hashKey){
    client.del(JSON.stringify(hashKey))
  }
}
