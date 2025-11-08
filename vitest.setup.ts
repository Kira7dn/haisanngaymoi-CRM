import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'

declare global {
  var testServer: import('http').Server;
  var expect: typeof import('vitest')['expect'];
  var vi: typeof import('vitest')['vi'];
}

// Make expect and vi global
global.expect = expect
global.vi = vi

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test'
process.env.MONGODB_DB = process.env.MONGODB_DB || 'testdb'
process.env.VITEST = 'true'
