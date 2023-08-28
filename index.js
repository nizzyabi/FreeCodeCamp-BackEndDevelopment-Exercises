// Exercise Tracker: FreeCodeCamp Back End Development and APIs

// Source code and help from Landon Schlangens youtube tutorial: 

//https://www.youtube.com/watchv=Xjaksspeq7Y&ab_channel=LandonSchlangen 

express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const { Schema } = mongoose
mongoose.connect(process.env['MONGO_URI'])

// Making Schemas

// 1 Connecting to MongoDB
const UserSchema = new Schema({
  username: String,
});
const User = mongoose.model("User", UserSchema)

//2 Making the DB
const ExeriseSchema = new Schema({
  user_id: { type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", ExeriseSchema);

// Requirements & Usage

require('dotenv').config()
app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

// Route postings
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Get all users

app.get('/api/users', async(req, res) => {
  const users = await User.find({}).select("_id username");
  if (!users) {
    res.send("No Users")
  } else {
    res.json(users)
  }
})

app.post('/api/users', async (req, res) => {
  console.log(req.body)
  const userObj = new User({
    // show body of the username 
    username: req.body.username
  })
  try {
    const user = await userObj.save()
    console.log(user)
    res.json(user)
  } catch (err) {
    console.log(err)
  }
})

// Posting & Saving Exercises 

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body

  try {
    const user = await User.findById(id)
    if (!user) {
      res.send('Could not find user')
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch (err) {
    console.log(err);
    res.send("There was an error saving.")
  }
})

// Logging 

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.send("Couldn't find user")
    return;
  }
  let dataObj = {}
  if (from) {
    dataObj["$gte"] = new Date(from)
  }
  if (to) {
    dataObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = dataObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)
  
  // Output
  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
