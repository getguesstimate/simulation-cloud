var _ = require('lodash')
import {Evaluate} from './evaluator.js'

const inputExtractor = /([^A-Z]|^)(([A-Z]{2})([^\(A-Z]|$)[^A-Z]*)+/g

function extractInputs(expr) {
  const matches = inputExtractor.exec(expr)
  if (matches) {
    return _.uniq(matches[0].match(/[A-Z]{2}/g))
  } else {
    return []
  }
}

export class Simulator {
  constructor(json_space, num_samples) {
    this.num_samples = num_samples
    this.errors = []
    this.nodes = []
    this.results = {}
    this.readableToIds = {}
    this.idsToReadables = {}

    let node_data = {}

    json_space.metrics.map( m => {
      this.readableToIds[m.readableId] = m.id
      this.idsToReadables[m.id] = m.readableId
      node_data[m.id] = m
    } )
    json_space.guesstimates.map( g => {
      node_data[g.metric].expr = g.input
      const readableInputs = extractInputs(g.input)
      node_data[g.metric].inputs = readableInputs.map(i => this.readableToIds[i])
      node_data[g.metric].readableInputs = readableInputs
    } )

    this._buildNodes(node_data)
  }

  simulate() {
    for (var i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i]
      let readableInputs = {}
      Object.keys(this.results).map( k => {if (_.some(node.inputs, i => i === k)) {readableInputs[this.idsToReadables[k]] = this.results[k].values}} )
      this.results[node.id] = Evaluate(node.expr, this.num_samples, readableInputs)
    }
  }

  _buildNodes(node_data) {
    const roots = _.filter(node_data, nd => nd.inputs.length === 0)
    let nextLevelNodes = roots
    do {
      this.nodes = this.nodes.concat(nextLevelNodes)
      nextLevelNodes = _.filter(node_data, nd => !_.some(this.nodes, n => n === nd) && _.every(nd.inputs, i => _.some(this.nodes, n => n.id === i)))
    } while (nextLevelNodes.length > 0)

    if (Object.keys(node_data).length !== this.nodes.length) {
      this.errors.push("Infinite Loop detected.")
    }
  }
}
