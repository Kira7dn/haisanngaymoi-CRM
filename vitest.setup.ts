import '@testing-library/jest-dom'

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test'
process.env.MONGODB_DB = process.env.MONGODB_DB || 'testdb'
process.env.VITEST = 'true'
