const mongoose = require('mongoose')
const dotenv = require('dotenv')

process.on('uncaughtException', err => {
  console.log('Uncaught Exception Shutting Down');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' })

const app = require('./app')

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(() => console.log('DATABASE IS CONNECTED'))

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Hello listening ${port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection Shutting Down')
  server.close(() => {
    process.exit(1);
  })
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED, Shutting down gracefully');
  server.close(() => {
    console.log('Process Terminated')
  });
})