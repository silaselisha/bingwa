import express from 'express'
import cors from 'cors'
import app from './server'

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
