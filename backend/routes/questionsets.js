import express from 'express'
import QuestionSet from '../models/QuestionSet.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// All question-set routes require a logged-in lecturer.
router.use(requireAuth)

router.post('/', async (req, res) => {
  const { title, questions } = req.body

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'title and a non-empty questions array are required' })
  }

  try {
    const questionSet = await QuestionSet.create({
      title,
      questions,
      lecturer: req.lecturerId,
    })
    res.status(201).json(questionSet)
  } catch (err) {
    // Mongoose validation errors (e.g. "exactly 4 options") land here
    res.status(400).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  const sets = await QuestionSet.find({ lecturer: req.lecturerId })
    .select('title questions createdAt')
    .sort({ createdAt: -1 })
  res.json(sets)
})

router.get('/:id', async (req, res) => {
  const set = await QuestionSet.findOne({ _id: req.params.id, lecturer: req.lecturerId })

  if (!set) {
    return res.status(404).json({ error: 'Question set not found' })
  }

  res.json(set)
})

export default router