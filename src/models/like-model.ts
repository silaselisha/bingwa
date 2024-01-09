import mongoose from 'mongoose'

interface ILike extends mongoose.Document {
  author: mongoose.Schema.Types.ObjectId
  post: mongoose.Schema.Types.ObjectId
  likeType: boolean
}

export type LikeModel = mongoose.Model<ILike, any, any>

const likeSchema = new mongoose.Schema<ILike, any, any>({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },

  likeType: { type: Boolean, default: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
})

const likeModel = mongoose.model<ILike, LikeModel>('Like', likeSchema)
export default likeModel
