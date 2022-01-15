const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const multer = require('multer')


const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

const upload = multer({
    dest: './images/',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/^(.)*\.(doc|docx)$/))
            cb(new Error("File must be a document(doc | docx)"))
        cb(undefined, true)
    }
})



app.listen(port, () => {
    console.log('Server is up on port ' + port)
})