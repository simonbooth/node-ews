'use strict'

//var ntlm = require('httpntlm');
var ntlm = require('ntlm-client')
var _ = require('lodash')

module.exports = {

  request: function (rurl, data, callback, exheaders, exoptions) {
    // parse args
    var args = Array.prototype.slice.call(arguments)
    rurl = args.shift()
    data = typeof args[0] === 'string' ? args.shift() : null
    callback = args.shift()
    // optional args
    exheaders = args.length > 0 ? args.shift() : null
    exoptions = args.length > 0 ? args.shift() : null

    var method = data ? 'post' : 'get'
    var headers = {}
    if (typeof data === 'string') {
      headers['Content-Type'] = 'text/xml;charset=UTF-8'
    }

    var options = {
      url: rurl,
      headers: headers
    }

    options.body = data ? data : null

    _.merge(options, exoptions)
    _.merge(options.headers, exheaders)
    var ntlmClientOptions = {
      uri: options.url,
      method: method,
      workstation: 'WORKSTATION',
      username: options.username,
      password: options.password,
      request: options
    }
    if (options.username.indexOf('\\') > -1) {
      ntlmClientOptions.target = options.username.split('\\')[0].toUpperCase()
      ntlmClientOptions.username = options.username.split('\\')[1].toLowerCase()
    }
    else if(options.username.indexOf('@') > -1){
      ntlmClientOptions.target = ''
    }

    ntlm.request(ntlmClientOptions)
      .then(function (res) {
        var body = res.body
        if (typeof body === 'string') {
          // Remove any extra characters that appear before or after the SOAP
          // envelope.
          var match = body.match(/(?:<\?[^?]*\?>[\s]*)?<([^:]*):Envelope([\S\s]*)<\/\1:Envelope>/i)
          if (match) {
            body = match[0]
          }
        }
        callback(null, res, body)
      })
      .catch(function (ex) {
        callback(ex)
      })
    // build request and return to node-soap
    var req = {}
    req.headers = options.headers
    req.body = options.body
    return req
  }

}
