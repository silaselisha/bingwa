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
  citations: string[]
  word_count?: number
  comments?: mongoose.Schema.Types.ObjectId[]
  comment_count?: number
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
    citations: [String],
    word_count: Number,
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
