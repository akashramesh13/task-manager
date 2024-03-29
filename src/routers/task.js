const express = require('express')
const Task = require('../models/task')
const router = new express.Router()
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).json(task)
    } catch (e) {
        res.status(400).json(e)
    }
})

router.get('/tasks', auth, async (req, res) => {
    try {
        const match = {}
        if (req.query.completed) {
            match.completed = req.query.completed === 'true'
        }
        const limit = parseInt(req.query.limit)
        const skip = parseInt(req.query.skip)
        const sort = {}
        console.log(req.query.sortBy);
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'asc' ? 1 : -1
        }

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit,
                skip,
                sort
            }
        }).execPopulate()
        res.json(req.user.tasks)
    } catch (e) {
        res.status(500).json(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({
            _id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).json()
        }

        res.json(task)
    } catch (e) {
        res.status(500).send({
            e
        })
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates!'
        })
    }

    try {
        const owner = req.user._id;
        const _id = req.params.id
        const task = await Task.findOne({
            _id,
            owner
        })
        if (!task) {
            return res.status(404).send({
                error: "No tasks found for given information"
            })
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()



        res.json(task)
    } catch (e) {
        res.status(400).json(e)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id
        const owner = req.user._id
        const task = await Task.findOne({
            _id,
            owner
        })

        if (!task) {
            res.status(404).json()
        }
        await task.delete()
        res.json(task)
    } catch (e) {
        res.status(500).json()
    }
})

module.exports = router