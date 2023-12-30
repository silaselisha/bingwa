import request from 'supertest'
import app from '../../app'
import { type userParams } from '../auth-controller'

describe('auth api test', () => {
  let data: userParams
  beforeAll(() => {
    data = {
      username: 'jan3',
      email: 'jan3@gmail.com',
      firstName: 'Jane',
      lastName: 'Doe',
      gender: 'female',
      role: 'user',
      password: 'Pass1234$',
      isActive: true,
      confirmPassword: 'Pass1234$'
    }
  })

  it('login 200 OK', async () => {
    await request(app)
      .post('/api/v1/users/signup')
      .send(data).expect(201)

    const resp = await request(app)
      .post('/api/v1/users/signin')
      .send({ email: 'jan3@gmail.com', password: 'Pass1234$' })
      .expect(200)

    expect(resp.body.token).toBeDefined()
    expect(resp.statusCode).toBe(200)
  })
})
