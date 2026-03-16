import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth.routes'
import departmentRouter from './routes/department.routes'
import categoryRouter from './routes/category.routes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Server kører' })
})

app.use('/api/auth', authRouter)
app.use('/api/departments', departmentRouter)
app.use('/api/categories', categoryRouter)

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server kører på port ${PORT}`)
})

export default app