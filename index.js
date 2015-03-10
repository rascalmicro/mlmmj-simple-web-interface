var express = require('express')
var bodyParser = require('body-parser')
var app = express()


// Add config module
var CONFIG = require('./services/ConfigParser')
var config = new CONFIG()

// Static content
app.use(express.static(__dirname + '/public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Consolidate, to make beautiful templates in nunjucks
var cons = require('consolidate')

// Assign the swig engine to .html files
app.engine('html', cons.nunjucks)

// Set .html as the default extension
app.set('view engine', 'html')
app.set('views', __dirname + '/views')

// Add mlmmj service wrapper module
var Mlmmj = require('./services/MlmmjWrapper')

app.param('name', function(req, res, next, name) {

    var group = null

    try {
      req.group = new Mlmmj(config.get('mlmmj').path, name)
      req.name = name
    } catch (err) {
      res.status(404).send(err.name + " : " + err.message)
      return
    }

    next()
})

app.get('/', function (req, res) {

  res.render('index', {
    title: 'Home'
  })

})

app.get('/list', function (req, res) {

  try {
    groups = Mlmmj.listGroups(config.get('mlmmj').path)
  } catch (err) {
    res.status(500).send(err.name + " : " + err.message)
    return
  }

  res.render('list', {
    title: 'List',
    groups: groups
  })

})

app.get('/group/:name', function(req, res){ 
    res.render('group', {
      title: 'Group ' + req.name,
      name: req.name
    })
})

app.get('/group/:name/control', function(req, res){
    res.render('control', {
      title: 'Group ' + req.name,
      name: req.name,
      flags: req.group.getFlags(),
      texts: req.group.getTexts(),
      values: req.group.getValues(),
      lists: req.group.getLists()
    })
})

app.get('/group/:name/subscribers', function(req, res){
    res.render('subscribers', {
      title: 'Group ' + req.name,
      name: req.name,
      subscribers: req.group.getSubscribers()
    })
})

app.post('/group/:name/save/:key', function(req, res){
    
    var key = req.params.key

    if (key == 'flags') {
      for (key in req.body) {
        req.group.setFlag(key, req.body[key])
      }
    } else if (key == 'texts') {
      for (key in req.body) {
        req.group.setText(key, req.body[key])
      }
    } else if (key == 'lists') {
      for (key in req.body) {
        req.group.setList(key, req.body[key].split("\n"))
      }
    } else if (key == 'values') {
      for (key in req.body) {
        req.group.setValue(key, req.body[key])
      }
    } else if (key == 'subscribers') {
      for (key in req.body) {
        req.group.setSubscribers(key, req.body[key])
      }
    }
    
    // Save to disk
    req.group.saveAll()
    res.status(200).send("1")

})

app.post('/group/:name/remove/:key', function(req, res){
    
    var key = req.params.key

    if (key == 'subscribers') {
      req.group.removeSubscriber(req.body.element)
    }

    // Save to disk
    req.group.saveAll()
    res.status(200).send("1")
})

app.post('/group/:name/add/:key', function(req, res){
    
    var key = req.params.key

    if (key == 'subscribers') {
      req.group.addSubscriber(req.body.element)
    }

    // Save to disk
    req.group.saveAll()
    res.status(200).send("1")
})

// Start application
var server = app.listen(config.get('server').port, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Starting mlmmj groups management interface at http://%s:%s', host, port)

})
