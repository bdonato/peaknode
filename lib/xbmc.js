var xbmc = require('xbmc')

function XBMC(config){
  this.connection, this.api, this.host = config.xbmc_host, this.port = config.xbmc_port;
  this.api = new xbmc.XbmcApi
  this.connect(true)
}

XBMC.prototype.connect = function(addListener){
  this.connection = new xbmc.TCPConnection({host:this.host, port:this.port, verbose:false})

  this.api.setConnection(this.connection)
  if(addListener){
    this.api.on('connection:open',  function() { console.log('XBMC connected') })
    this.api.on('connection:close', function() { console.log('XBMC disconnected') })
    this.api.on('connection:data', function(json){
      if(json.method != undefined){ //Log notifications
        console.log('XBMC !! ', json.method)
        console.log(json.params)
      }
    })
  }
}

XBMC.prototype.reconnect = function(res){
  var that = this
  this.api.disconnect(function(){
    that.connect(false)
    res.status(201).send()
  })
}
  
//Send JSON API command with parameters, return JSON response
XBMC.prototype.command = function(cmd, p, res){
  console.log('XBMC -> ', cmd)
  this.connection.send({ method:cmd, id:1, params:p }).then(function(data) { res.json(data) }, function(err){ res.json({ error:err })})
}
  
//Send JSON API command with parameters, execute callback function
XBMC.prototype.chain = function(cmd, p, fn){
  console.log('XBMC -> ', cmd)
  this.connection.send({ method:cmd, id:1, params:p }).then(fn)
}

XBMC.prototype.request = function(cmd, p, fn){
  console.log('XBMC ?? ', cmd)
  this.connection.send({ method:cmd, id:1, params:p }).then(function(data) { fn(data) }, function(err){ res.json({ error:err })})
}

XBMC.prototype.isInput = function(ctl){
  return ['left', 'right', 'up', 'down', 'select', 'back', 'home'].indexOf(ctl) > -1
}

XBMC.prototype.isMove = function(ctl){
  return ['toggle', 'previous', 'next', 'stop'].indexOf(ctl) > -1
}

XBMC.prototype.isSystem = function(ctl){
  return ['reboot', 'shutdown'].indexOf(ctl) > -1
}
  
XBMC.prototype.player = function(action, res){
  var p = { playerid:0 }, self = this, cmd;
  self.chain('Player.GetActivePlayers', {}, function(d){
    if(!d.result.length) return res.json({ error:'No players detected' })
    var player = d.result[0]
    
    if(player.playerid == 0){ //Music
      if(action == 'toggle')
        cmd = 'Player.PlayPause';
      else if(action == 'next')
        cmd = 'Player.Move', p.direction = 'right';
      else if(action == 'previous')
        cmd = 'Player.Move', p.direction = 'left';
      else if(action == 'stop')
        cmd = 'Player.Stop';
      //Send Action
      self.command(cmd, p, res)
    }
    else if(player.playerid == 1){ //Video
      // if(action == 'toggle') cmd = 'Player.PlayPause';
      // self.command(cmd, p, res)
      res.json(player)
    }
  })
}

module.exports = function(c){ return new XBMC(c) }