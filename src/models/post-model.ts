import mongoose, { now } from 'mongoose'

export interface IPost extends mongoose.Document {
  user_id: mongoose.Schema.Types.ObjectId
  headline: string
  article_body: string
  article_section: string
  image?: string
  summary?: string
  citations: string[]
  word_count?: number
  comments?: mongoose.Schema.Types.ObjectId[]
  comment_count?: number
  date_published: Date
  date_updated?: Date
}

const postSchema = new mongoose.Schema<IPost>(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    headline: {
      type: String,
      required: [true, 'title field is compulsory'],
      trim: true
    },
    article_body: {
      type: String,
      required: [true, 'article body is compulsory'],
      trim: true
    },
    article_section: {
      type: String,
      required: [true, 'article section is compulsory'],
      trim: true
    },
    image: String,
    summary: String,
    citations: [String],
    word_count: Number,
    comments: [mongoose.Schema.Types.ObjectId],
    comment_count: Number,
    date_published: {
      type: Date,
      default: now()
    },
    date_updated: Date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

const postModel = mongoose.model('post', postSchema)
export default postModel
