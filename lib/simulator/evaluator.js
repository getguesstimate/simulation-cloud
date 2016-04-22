var _ = require('lodash')
import math from 'mathjs'
import {jStat} from 'jstat'
var Finance = require('financejs')
const finance = new Finance()

const jStatDistributions = {
  beta: jStat.beta.sample,
  centralF: jStat.centralF.sample,
  cauchy: jStat.cauchy.sample,
  chisquare: jStat.chisquare.sample,
  exponential: jStat.exponential.sample,
  invgamma: jStat.invgamma.sample,
  lognormal: jStat.lognormal.sample,
  normal: jStat.normal.sample,
  studentt: jStat.studentt.sample,
  weibull: jStat.weibull.sample,
  uniform: jStat.uniform.sample,
  gamma: jStat.gamma.sample
}

const financeFunctions = {
  PV: finance.PV,
  FV: finance.FV,
  NPV: finance.NPV,
  //IRR: finance.IRR, Too slow.
  PP: finance.PP,
  ROI: finance.ROI,
  AM: finance.AM,
  PI: finance.PI,
  DF: finance.DF,
  CI: finance.CI,
  CAGR: finance.CAGR,
  LR: finance.LR,
  R72: finance.R72,
  WACC: finance.WACC
}

// Here, we extend the math.js parser and library with the jStat sample functions. We override any default math.js
// functions because we want the jStat distributions to have priority.
math.import(jStatDistributions, {override: true})
// Here, we extend the math.js parser with financial functions.
math.import(financeFunctions, {override: true})

// All of jStat's functions are impure as they require sampling on pure inputs.
const STOCHASTIC_FUNCTIONS = ['pickRandom', 'randomInt', 'random'].concat(Object.keys(jStatDistributions))

export function Evaluate(text, n, inputs) {
  try {
    const compiled = math.compile(text)
    const sampleCount = requiresManySamples(text, inputs) ? n : 1
    return evaluate(compiled, inputs, sampleCount)
  } catch (exception) {
    return {errors: [exception.message]}
  }
}

const hasStochasticFunction = text => _.some(STOCHASTIC_FUNCTIONS, e => text.indexOf(e) !== -1)

const requiresManySamples = (text, inputs) => {
  for (let key of Object.keys(inputs)) {
    if (_.some(inputs[key], i => i !== inputs[key][0])) { // Could also just do length === 1?
      return true
    }
  }
  return hasStochasticFunction(text)
}

function sampleInputs(inputs, i) {
  const sample = {}
  for (let key of Object.keys(inputs)){
    sample[key] = inputs[key][i % inputs[key].length]
  }
  return sample
}

function evaluate(compiled, inputs, n){
  let values = []
  for (let i = 0; i < n; i++) {
    const sampledInputs = sampleInputs(inputs,i)
    if (i === 0) {debugger}
    const newSample = compiled.eval(sampledInputs)

    if (_.isFinite(newSample)) {
      values = values.concat(newSample)
    } else {
      if (i === 0) {debugger}
      return {values, errors: ['Invalid sample']}
    }
  }

  return {values}
}
