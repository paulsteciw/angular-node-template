import express from 'express'
import { Person } from '../../dtos/person'
import { Request, Response } from 'express'

const app = express()
const PORT = 3000

app.use(express.static('public'))

app.get('/api/people', (_req: Request, res: Response) =>
  res.send([
    {
      lastName: 'Smith',
      firstName: 'John',
      id: '123',
    },
    {
      lastName: 'Doe',
      firstName: 'Jane',
      id: '345',
    },
  ] as Person[])
)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
