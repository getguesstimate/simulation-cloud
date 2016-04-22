var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
import {Evaluate} from './simulator/evaluator.js'

var app = express()

app.use(bodyParser.json({limit: "50mb"}))
app.use(bodyParser.urlencoded({extended: true, limit: "50mb"}))

app.use(cors())

app.post('/simulate', function (req, res) {
  var body = req.body

  var errors = []
  if (!body.expr) {
    errors.push("expr key required")
  }
  if (!body.numSamples) {
    errors.push("numSamples key required")
  }

  if (errors.length > 0) {
    res.json({errors: errors})
    return
  }

  res.json(Evaluate(body.expr, body.numSamples, !!body.inputs ? body.inputs : []))
})

var server = app.listen(5000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
