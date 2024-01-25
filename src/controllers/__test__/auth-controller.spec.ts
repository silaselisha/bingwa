import app from '../../app'
import request from 'supertest'

describe('Authentication', () => {
  test('test', async () => {
    const resp = await request(app).get('/api/v1/metric')
    expect(resp.statusCode).toEqual(200)
  })
})
