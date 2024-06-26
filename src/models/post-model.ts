import mongoose from 'mongoose'
export interface IPost extends mongoose.Document {
  author: mongoose.Schema.Types.ObjectId
  headline: string
  article_body: string
  article_section: string
  thumbnail: string
  images?: string[]
  summary?: string
  likes?: mongoose.Schema.Types.ObjectId[]
  word_count?: number
  tags?: mongoose.Schema.Types.ObjectId[]
  comments?: mongoose.Schema.Types.ObjectId[]
  comment_count?: number
  speakers?: string[]
  venue: string
  start_time: Date
  end_time: Date
  date_published: Date
  date_updated?: Date
}

export type PostModel = mongoose.Model<IPost, any, any>

const postSchema = new mongoose.Schema<IPost, PostModel, any>(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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
    thumbnail: String,
    images: [String],
    summary: String,
    word_count: Number,
    tags: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Like' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    comment_count: Number
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
)

const postModel = mongoose.model<IPost, PostModel>('Post', postSchema)
export default postModel
