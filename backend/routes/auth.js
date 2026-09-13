import express from 'express'
import jwt from 'jsonwebtoken'
import Lecturer from '../models/Lecturer.js'

const router = express.Router()

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' })
  }

  const existing = await Lecturer.findOne({ email: email.toLowerCase() })
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' })
  }

  const lecturer = new Lecturer({ name, email })
  await lecturer.setPassword(password)
  await lecturer.save()

  const token = jwt.sign({ lecturerId: lecturer._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, lecturer: { id: lecturer._id, name: lecturer.name, email: lecturer.email } })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const lecturer = await Lecturer.findOne({ email: email?.toLowerCase() })
  if (!lecturer) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const valid = await lecturer.checkPassword(password)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign({ lecturerId: lecturer._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, lecturer: { id: lecturer._id, name: lecturer.name, email: lecturer.email } })
})

export default router