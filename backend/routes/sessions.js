import express from 'express'
import { customAlphabet } from 'nanoid'
import QuestionSet from '../models/QuestionSet.js'
import { requireAuth } from '../middleware/auth.js'
import { rooms, createRoomState } from '../sockets/roomState.js'

const router = express.Router()
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6) // no ambiguous chars like O/0, I/1

router.use(requireAuth)

router.post('/start', async (req, res) => {
  const { questionSetId } = req.body

  const questionSet = await QuestionSet.findOne({ _id: questionSetId, lecturer: req.lecturerId })
  if (!questionSet) {
    return res.status(404).json({ error: 'Question set not found' })
  }

  let code = generateCode()
  while (rooms.has(code)) {
    code = generateCode()
  }

  rooms.set(code, createRoomState({
    lecturerId: req.lecturerId,
    questions: questionSet.questions,
  }))

  res.status(201).json({ roomCode: code })
})

export default router