const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

const app = express()

//GLOBAL MIDDLEWARE
// Add secure header to the request
app.use(helmet())

//for data back of api call and the route or status
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}
//Serve static file for query
app.use(express.static(`${__dirname}/public`))

// app.use((req, res, next) => {
//     console.log('Hello from middleware ')
//     next();
// })

//Limit for the brute force attack and limit the req
const limiter = rateLimit({ 
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, Please try again after 1 hour!'
 })
app.use('/api', limiter)

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//It prevent from some unwanted mongo $ sign error 
app.use(mongoSanitize());

//prevent from some html xs attacks
app.use(xss());

app.use(hpp({
    whitelist: ['duration', 'price', 'difficulty']
}))

//Todat date and time stamp at header
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
})

// ROUTES
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
})

app.use(globalErrorHandler)

module.exports = app;