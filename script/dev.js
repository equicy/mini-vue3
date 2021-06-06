const fs = require('fs')
const execa = require('execa')

const target = 'reactivity'

build(target)

async function build(target) {

  await execa('rollup', ['-wc', '--environment', `TARGET:${target}`], {stdio: 'inherit'})
}

