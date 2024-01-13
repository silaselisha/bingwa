import type mongoose from 'mongoose'

class Tooling {
  constructor (public _query: mongoose.Query<any, any>) { }

  pagination = async (page: number, limit: number): Promise<Tooling> => {
    const offset = (page - 1) * limit
    this._query = this._query.skip(offset).limit(limit)
    return this
  }

  populate = async (path: string, selects?: any, populates?: any): Promise<Tooling> => {
    this._query = this._query.populate({ path, select: selects, populate: populates })
    return this
  }
}

export default Tooling
