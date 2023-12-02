declare namespace Express {
  import { type IUser } from './models/user-model'
  export interface Request {
    user: IUser
  }
}
