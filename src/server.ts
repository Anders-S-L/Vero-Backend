import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Health check — test om serveren kører
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server kører' })
})

app.listen(PORT, () => {
    console.log(`Server kører på port ${PORT}`)
})

export default app