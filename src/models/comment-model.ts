import mongoose from 'mongoose'

export interface IComment extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId
  post_id: mongoose.Schema.Types.ObjectId
  comment: string
  createdAt: Date
}

type CommentModel = mongoose.Model<IComment, unknown, unknown>
const commentSchema = new mongoose.Schema<IComment>(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    post_id: mongoose.Schema.Types.ObjectId,
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

const commentModel = mongoose.model<IComment, CommentModel>('comment', commentSchema)
export default commentModel
