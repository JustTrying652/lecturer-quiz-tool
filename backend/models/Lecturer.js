import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const lecturerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true })

// Hash the password automatically whenever it's set/changed, so nowhere
// else in the codebase ever has to remember to call bcrypt manually.
lecturerSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, 10)
}

lecturerSchema.methods.checkPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash)
}

export default mongoose.model('Lecturer', lecturerSchema)