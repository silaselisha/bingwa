import mongoose from 'mongoose'
export interface IEvent extends mongoose.Document {
  author: mongoose.Schema.Types.ObjectId
  headline: string
  event_body: string
  event_section: string
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

export type EventModel = mongoose.Model<IEvent, any, any>

const eventSchema = new mongoose.Schema<IEvent, EventModel, any>(
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
    event_body: {
      type: String,
      required: [true, 'article body is compulsory'],
      trim: true
    },
    event_section: {
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

const eventModel = mongoose.model<IEvent, EventModel>('Event', eventSchema)
export default eventModel
