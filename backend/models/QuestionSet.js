import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => arr.length === 4,
      message: 'Each question must have exactly 4 options',
    },
  },
  correctAnswer: { type: String, required: true },
}, { _id: false })

const questionSetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecturer', required: true },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: (arr) => arr.length > 0,
      message: 'A question set must have at least one question',
    },
  },
}, { timestamps: true })

export default mongoose.model('QuestionSet', questionSetSchema)