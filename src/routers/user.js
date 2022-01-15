const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const {
    sendWelcomeEmail,
    sendCancellationEmail
} = require('../emails/account')

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).json({
            user,
            token
        })
    } catch (e) {
        res.status(400).json(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.json({
            user,
            token
        })
    } catch (e) {
        res.status(400).json()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.json()
    } catch (e) {
        res.status(500).json()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.json()
    } catch (e) {
        res.status(500).json()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.json(req.user)
})

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const user = await User.findById(_id)

        if (!user) {
            return res.status(404).json()
        }

        res.json(user)
    } catch (e) {
        res.status(500).json()
    }
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).json({
            error: 'Invalid updates!'
        })
    }

    try {
        const user = req.user

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.json(user)
    } catch (e) {
        res.status(400).json(e)
    }
})


router.delete('/users/me', auth, async (req, res) => {
    try {
        const user = await req.user
        await user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.json(user)
    } catch (e) {
        res.status(500).json()
    }
})

const upload = multer({
    flimits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/^(.)*\.(jpg|jpeg|png)$/))
            cb(new Error("File must be an image(jpg|jpeg|png)"))
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer()
    req.user.avatar = buffer

    await req.user.save()

    res.json({
        message: "Profile picture successfully saved"
    })
}, (err, req, res, next) => {
    res.status(400).send({
        error: err.message
    })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.json()

})

router.get('/users/me/avatar', auth, async (req, res) => {
    const _id = req.user._id
    try {
        const user = await User.findById(_id)
        if (!user || !user.avatar)
            throw new Error("No data found")
        res.set('Content-Type', 'image/png')
        res.json(user.avatar)
    } catch (error) {
        res.status(404).json(error)
    }
})

module.exports = router