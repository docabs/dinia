'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/dinia.prod.cjs')
} else {
  module.exports = require('./dist/dinia.cjs')
}
