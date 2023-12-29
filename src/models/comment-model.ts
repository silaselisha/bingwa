import mongoose from 'mongoose'

export interface IComment extends mongoose.Document {
  author: mongoose.Schema.Types.ObjectId
  post: mongoose.Schema.Types.ObjectId
  comment: string
  createdAt: Date
}

export type CommentModel = mongoose.Model<IComment, unknown, unknown>
const commentSchema = new mongoose.Schema<IComment>(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    comment: {
      type: String,
      required: [true, 'comment is a compulsory field'],
      trim: true,
      maxlength: 255
    },
    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

const commentModel = mongoose.model<IComment, CommentModel>(
  'Comment',
  commentSchema
)
export default commentModel
