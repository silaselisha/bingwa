import mongoose from 'mongoose'

export enum likeTypeEnum {
  like = 'like',
  dislike = 'dislike'
}

export interface ILike extends mongoose.Document {
  user: mongoose.Schema.Types.ObjectId
  post: mongoose.Schema.Types.ObjectId
  likeType: likeTypeEnum
}

export type LikeModel = mongoose.Model<ILike, any, any>

const likeSchema = new mongoose.Schema<ILike, any, any>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },

  likeType: { type: String, enum: likeTypeEnum, required: true }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true
})

likeSchema.index({ user: 1, post: 1 })

const likeModel = mongoose.model<ILike, LikeModel>('Like', likeSchema)
export default likeModel
