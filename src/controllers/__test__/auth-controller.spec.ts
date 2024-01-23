import { type Request, type NextFunction, type Response } from 'express'

import { winstonLogger } from '../../util'
import AccessToken from '../../util/token'
import AuthController from '../auth-controller'
import UserModel from '../../models/user-model'
import AuthServices from '../../services/auth-services'

describe('auth controller test', () => {
  jest.mock('../../util/token')
  jest.mock('../../models/user-model')
  const mockUserModel = UserModel as jest.Mocked<typeof UserModel>
  const mockAccessToken = new AccessToken() as jest.Mocked<AccessToken>
  const authServices = new AuthServices(mockUserModel)
  const authController = new AuthController(authServices, mockAccessToken)

  const mockUser = {
    username: 'lace',
    email: 'alice@example.com',
    lastName: 'Doe',
    firstName: 'Alce',
    gender: 'female',
    password: 'Abstract87$',
    confirmPassword: 'Abstract87$',
    phone: '254791908160',
    nationalID: 24024024
  }
  const mockUserDoc = new UserModel(mockUser)

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFsaWNlIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsImlhdCI6MTYxNjE0MjQwMH0.0J4Q3y7a0g0k0J4Q3y7a0g0k0J4Q3y7a0g0k0J4Q3y7a0g0k'

  mockUserModel.create.mockResolvedValue(mockUserDoc as any)
  mockAccessToken.createAccessToken.mockReturnValue(Promise.resolve(mockToken))

  test('signup', async () => {
    /**
     * @injectables
     * authServices -> signup(data: userParams) is async injected with userModel
     * accessToken -> createToken(payload: { email: string }) is async
     */
    winstonLogger('warn', 'tests.log').info('testing signup')
    const mockReq = { body: mockUser } as unknown as Request
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response
    const mockNext = {} as unknown as NextFunction

    await authController.authSigninHandler(mockReq, mockRes, mockNext)
  })
})
