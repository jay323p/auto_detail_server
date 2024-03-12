const mongoose = require('mongoose');

const calendarSchema = mongoose.Schema({
  dates: {
    type: Object,
    default: {},
  },
});

const Calendar = mongoose.model('Calendar', calendarSchema);

module.exports = Calendar;

// [[{}...]...]
// the dates will be an array of arrays where the parent array is the year and each child array is the month. Within each child/month array, elems will be objects corresponding to each day of the month. Each object will contain the day (ref for mon, tue, etc), the localDate (09/04/23), reserved (bool), and userIdRef (mongodb _id ref). Retreiving only the day, localDate, and reserved will be avaible to client whereas manager can get all data. So manager protect this route.

// add redirect if user wants booking page but then proceeded to login, after login or signup, have redux state redirect (default equal null), but updated state is priority to page state so after login/signup, they will go there.
