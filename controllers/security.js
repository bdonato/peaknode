function API(db, omni)
{
  this.status = function(req, res){    
    db.security.find(1).success(function(entry){
      res.json(entry.parse())
    })
  }

  this.setStatus = function(req, res){
    var id     = req.body.id
      , state  = req.body.state
      , pinkey = req.body.pinkey
    
    //Ensure user has permission
    db.user.find(id).success(function(u){
      if(u == undefined) return res.status(400).json({ error:'Invalid user' })
      else if(pinkey != u.pinkey) return res.status(400).json({ error:'Invalid pinkey' })
    
      //Send command thru TCP
      omni.security('control', {state:state})
    
      //Log/return security state change
      db.security.create({ state:state }).success(function(entry){
        res.json(entry.parse())
      })
    })
  }
}
module.exports = function(d, c){ return new API(d, c) }