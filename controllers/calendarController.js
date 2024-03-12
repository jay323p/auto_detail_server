const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Calendar = require('../models/calendarModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dateFns = require('date-fns');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
// // GEN TOKEN -----------------------------------------------------------------------------------------------
// const genToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
// };

// CREATE/INIT CALENDAR -------------------------------------------------------------------------------------------
const initCalendar = asyncHandler(async (req, res) => {
  const calendarAlready = await Calendar.find({});

  if (calendarAlready.length > 0) {
    res.status(400);
    throw new Error(
      'Calendar already provided. Unable to initiate another calendar!'
    );
  }

  const today = new Date();
  const oneYear = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  );

  const dates = dateFns.eachDayOfInterval({ start: today, end: oneYear });
  const thisYearNum = '4'; //need to make dynamically update instead of manually
  const nextYearNum = '5'; //need to make dynamically update instead of manually
  let thisYearOrganized = [];
  let nextYearOrganized = [];
  let organizer = [];
  let previousMonth = '1';
  let previousDate = '';
  for (let i = 0; i < dates.length; i++) {
    let dateObj = {
      localDate: '',
      day: 0,
      timeSlots: [
        { time: '7:00AM', reserved: false, reservedBy: '' },
        { time: '8:00AM', reserved: false, reservedBy: '' },
        { time: '9:00AM', reserved: false, reservedBy: '' },
        { time: '10:00AM', reserved: false, reservedBy: '' },
        { time: '11:00AM', reserved: false, reservedBy: '' },
        { time: '12:00PM', reserved: false, reservedBy: '' },
        { time: '1:00PM', reserved: false, reservedBy: '' },
        { time: '2:00PM', reserved: false, reservedBy: '' },
        { time: '3:00PM', reserved: false, reservedBy: '' },
        { time: '4:00PM', reserved: false, reservedBy: '' },
        { time: '5:00PM', reserved: false, reservedBy: '' },
        { time: '6:00PM', reserved: false, reservedBy: '' },
        { time: '7:00PM', reserved: false, reservedBy: '' },
      ],
    };
    let localDate = dates[i].toLocaleDateString();
    let month = localDate.slice(0, 2);
    let day = dateFns.getDay(dates[i]);
    dateObj.localDate = localDate;
    dateObj.day = day;

    if (month === previousMonth) {
      organizer.push(dateObj);
      previousDate = localDate;
    } else {
      let lastIndex = previousDate.length - 1;
      let lastIndexStringValue = previousDate[lastIndex];

      if (lastIndexStringValue === thisYearNum) {
        thisYearOrganized.push(organizer);
        organizer = [];
      } else if (lastIndexStringValue === nextYearNum) {
        nextYearOrganized.push(organizer);
        organizer = [];
      }
      organizer.push(dateObj);
    }
    previousMonth = month;

    if (i === dates.length - 1) {
      nextYearOrganized.push(organizer);
    }
  }

  const sender = {
    thisYearOrganized,
    nextYearOrganized,
  };

  const newCalendar = await Calendar.create({ dates: sender });

  res.status(200).json(newCalendar);
});

// UPDATE CALENDAR DATE TO TODAY -------------------------------------------------------------------------------------------
const updateDateToToday = asyncHandler(async (req, res) => {
  //   validation/find stored calendar
  const { id } = req.body;
  console.log('id check');
  console.log(id);
  console.log(typeof id);
  if (!id) {
    res.status(400);
    throw new Error('Calendar ID not provided for update!');
  }
  if (id.length !== 24) {
    res.status(400);
    throw new Error('Calendar ID provided not long enough!');
  }
  const fixedId = new ObjectId(id.toString());
  const storedCalendar = await Calendar.findById(fixedId);
  if (!storedCalendar) {
    res.status(400);
    throw new Error('Invalid calendar ID provided for update!');
  }

  // gen new dates starting with today to 1-year from now
  const today = new Date();
  const oneYear = new Date(
    new Date().setFullYear(new Date().getFullYear() + 1)
  );
  const dates = dateFns.eachDayOfInterval({ start: today, end: oneYear });

  // calendar organization vars
  const thisYearNum = '3';
  const nextYearNum = '4';
  let thisYearOrganized = [];
  let nextYearOrganized = [];
  let organizer = [];
  const yesterday = new Date(Date.now() - 86400000);
  let previousDate = yesterday.toLocaleDateString();
  let previousMonth = previousDate.slice(0, 2);

  // loop through each date and create date obj to be ins to respective year arr ^^
  for (let i = 0; i < dates.length; i++) {
    console.log(i);
    let dateObj = {
      localDate: '',
      day: 0,
      timeSlots: [],
    };

    let localDate = dates[i].toLocaleDateString();
    let month = localDate.slice(0, 2);
    let day = dateFns.getDay(dates[i]);
    let lastIndex = previousDate.length - 1;
    let lastIndexStringValue = previousDate[lastIndex]; //this val keeps track of year

    if (month === '1/' && previousMonth === '12') {
      lastIndexStringValue = thisYearNum;
    }
    if (month === '1/' && previousMonth === '1/') {
      lastIndexStringValue = nextYearNum;
    } // when new year starts, bug occurs if you dont fix lastIndexStringValue this way

    dateObj.localDate = localDate;
    dateObj.day = day;

    if (i === dates.length - 1) {
      console.log('at length');
      // new calendar date (db calendar wont have timeSlots so init)
      dateObj.timeSlots = [
        { time: '7:00AM', reserved: false, reservedBy: '' },
        { time: '8:00AM', reserved: false, reservedBy: '' },
        { time: '9:00AM', reserved: false, reservedBy: '' },
        { time: '10:00AM', reserved: false, reservedBy: '' },
        { time: '11:00AM', reserved: false, reservedBy: '' },
        { time: '12:00PM', reserved: false, reservedBy: '' },
        { time: '1:00PM', reserved: false, reservedBy: '' },
        { time: '2:00PM', reserved: false, reservedBy: '' },
        { time: '3:00PM', reserved: false, reservedBy: '' },
        { time: '4:00PM', reserved: false, reservedBy: '' },
        { time: '5:00PM', reserved: false, reservedBy: '' },
        { time: '6:00PM', reserved: false, reservedBy: '' },
        { time: '7:00PM', reserved: false, reservedBy: '' },
      ];
    }

    if (i < dates.length - 1) {
      if (month === previousMonth) {
        // next date iteration in same month as prev date iteration
        //   extract timeSlot data from respective date in storedCalendar based off year
        if (lastIndexStringValue === thisYearNum) {
          const respectiveMonthArray =
            storedCalendar.dates.thisYearOrganized.filter(
              (arr) => arr[0].localDate.slice(0, 2) === month
            );
          const respectiveTimeSlot = respectiveMonthArray[0].filter(
            (date) => date.localDate === dateObj.localDate
          );
          dateObj.timeSlots = respectiveTimeSlot[0].timeSlots;
        } else if (lastIndexStringValue === nextYearNum) {
          const respectiveMonthArray =
            storedCalendar.dates.nextYearOrganized.filter(
              (arr) => arr[0].localDate.slice(0, 2) === month
            );
          const respectiveTimeSlot = respectiveMonthArray[0].filter(
            (date) => date.localDate === dateObj.localDate
          );
          console.log(respectiveTimeSlot);
          if (respectiveTimeSlot.length > 0) {
            dateObj.timeSlots = respectiveTimeSlot[0].timeSlots;
          } else {
            dateObj.timeSlots = [
              { time: '7:00AM', reserved: false, reservedBy: '' },
              { time: '8:00AM', reserved: false, reservedBy: '' },
              { time: '9:00AM', reserved: false, reservedBy: '' },
              { time: '10:00AM', reserved: false, reservedBy: '' },
              { time: '11:00AM', reserved: false, reservedBy: '' },
              { time: '12:00PM', reserved: false, reservedBy: '' },
              { time: '1:00PM', reserved: false, reservedBy: '' },
              { time: '2:00PM', reserved: false, reservedBy: '' },
              { time: '3:00PM', reserved: false, reservedBy: '' },
              { time: '4:00PM', reserved: false, reservedBy: '' },
              { time: '5:00PM', reserved: false, reservedBy: '' },
              { time: '6:00PM', reserved: false, reservedBy: '' },
              { time: '7:00PM', reserved: false, reservedBy: '' },
            ];
          }
        }
        organizer.push(dateObj);
        previousDate = localDate;
      } else {
        // next date iteration starts new month
        //   extract timeSlot data from respective date in storedCalendar based off year
        if (lastIndexStringValue === thisYearNum) {
          thisYearOrganized.push(organizer);
          organizer = [];
        } else if (lastIndexStringValue === nextYearNum) {
          nextYearOrganized.push(organizer);
          organizer = [];
        }
        if (month === '1/' && previousMonth === '12') {
          lastIndexStringValue = nextYearNum;
        } // this statement fixes the bug that is produced when searching for timeslots of 01/01/anyYear (begining of year) as lastIndexStringValue is of last year for proper month array insertion into proper year array insertion. We have to update the year so that we fetch proper date timeSlots.

        if (lastIndexStringValue === thisYearNum) {
          const respectiveMonthArray =
            storedCalendar.dates.thisYearOrganized.filter(
              (arr) => arr[0].localDate.slice(0, 2) === month
            );
          const respectiveTimeSlot = respectiveMonthArray[0].filter(
            (date) => date.localDate === dateObj.localDate
          );
          dateObj.timeSlots = respectiveTimeSlot[0].timeSlots;
        } else if (lastIndexStringValue === nextYearNum) {
          const respectiveMonthArray =
            storedCalendar.dates.nextYearOrganized.filter(
              (arr) => arr[0].localDate.slice(0, 2) === month
            );
          console.log('respectiveMonthArray ---------------');
          console.log(respectiveMonthArray);
          const respectiveTimeSlot = respectiveMonthArray[0].filter(
            (date) => date.localDate === dateObj.localDate
          );
          dateObj.timeSlots = respectiveTimeSlot[0].timeSlots;
        }
        organizer.push(dateObj);
        previousDate = localDate;
      }
      previousMonth = month;

      //   //   reached one-year from today, push!
      //   if (i === dates.length - 1) {
      //     nextYearOrganized.push(organizer);
      //   }
    } else {
      organizer.push(dateObj);
      nextYearOrganized.push(organizer);
    }
  }

  // save -> send
  const sender = {
    thisYearOrganized,
    nextYearOrganized,
  };
  storedCalendar.dates = {};
  storedCalendar.dates = sender;
  storedCalendar.markModified('dates');
  await storedCalendar.save();
  res.status(200).json(storedCalendar);
});

// GET CALENDAR
const getCalendar = asyncHandler(async (req, res) => {
  const storedCalendar = await Calendar.find({});
  // only one-instance of calendar

  if (!storedCalendar) {
    res.status(400);
    throw new Error('Invalid calendar ID provided for retrieval!');
  } else {
    res.status(200).json(storedCalendar[0]);
  }
});

// RESERVE TIME SLOT
const reserveTimeSlot = asyncHandler(async (req, res) => {
  const { dateChosen, timeSlot, userId } = req.body;

  if (!dateChosen || !timeSlot || !userId) {
    res.status(400);
    throw new Error('Unable to book appointment, please try again!');
  }

  if (userId.length !== 24) {
    res.status(400);
    throw new Error('User ID not provided, please login or signup!');
  }
  const fixedId = new ObjectId(userId.toString());
  const customer = await User.findById(fixedId);

  if (!customer) {
    res.status(404);
    throw new Error('Please login or signup before booking!');
  }

  const storedCalendar = await Calendar.find({});

  if (!storedCalendar) {
    res.status(400);
    throw new Error('Unable to book at this time. Please try later.');
  }

  const dateChosenYear = dateChosen.slice(-2);
  let yearFilter;
  for (let i = 0; i < 2; i++) {
    if (i === 0) {
      const dbCalThisYear =
        storedCalendar[0].dates.thisYearOrganized[0][0].localDate.slice(-2);
      if (dbCalThisYear === dateChosenYear) {
        yearFilter = 'thisYear';
      } else {
        yearFilter = 'nextYear';
      }
    }
  }

  let datesToBeFilterd;
  if (yearFilter === 'thisYear') {
    datesToBeFilterd = storedCalendar[0].dates.thisYearOrganized;
  } else {
    datesToBeFilterd = storedCalendar[0].dates.nextYearOrganized;
  }

  if (yearFilter === 'thisYear') {
    for (let i = 0; i < storedCalendar[0].dates.thisYearOrganized.length; i++) {
      for (
        let j = 0;
        j < storedCalendar[0].dates.thisYearOrganized[i].length;
        j++
      ) {
        if (
          storedCalendar[0].dates.thisYearOrganized[i][j].localDate ===
          dateChosen
        ) {
          for (
            let k = 0;
            k <
            storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots.length;
            k++
          ) {
            if (
              storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[k]
                .time === timeSlot
            ) {
              if (
                storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[k]
                  .reserved === true
              ) {
                res.status(400);
                throw new Error('Sorry, this time slot is already booked!');
              } else {
                storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[
                  k
                ].reserved = true;
                storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[
                  k
                ].reservedBy = userId;
                storedCalendar[0].markModified('dates');
                await storedCalendar[0].save();
              }
            }
          }
        }
      }
    }
  } else {
    for (let i = 0; i < storedCalendar[0].dates.nextYearOrganized.length; i++) {
      for (
        let j = 0;
        j < storedCalendar[0].dates.nextYearOrganized[i].length;
        j++
      ) {
        if (
          storedCalendar[0].dates.nextYearOrganized[i][j].localDate ===
          dateChosen
        ) {
          for (
            let k = 0;
            k <
            storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots.length;
            k++
          ) {
            if (
              storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[k]
                .time === timeSlot
            ) {
              if (
                storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[k]
                  .reserved === true
              ) {
                res.status(400);
                throw new Error('Sorry, this time slot is already booked!');
              } else {
                storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[
                  k
                ].reserved = true;
                storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[
                  k
                ].reservedBy = userId;
                storedCalendar[0].markModified('dates');
                await storedCalendar[0].save();
              }
            }
          }
        }
      }
    }
  }

  res.send(storedCalendar);
});

const unreserveTimeSlot = asyncHandler(async (req, res) => {
  const { dateChosen, timeSlot, userId } = req.body;

  if (!dateChosen || !timeSlot || !userId) {
    res.status(400);
    throw new Error(
      'Unable to cancel appointment, please try again or call us!'
    );
  }

  if (userId.length !== 24) {
    res.status(400);
    throw new Error('User ID not provided, please login or signup!');
  }
  const fixedId = new ObjectId(userId.toString());
  const customer = await User.findById(fixedId);

  if (!customer) {
    res.status(404);
    throw new Error('Please login or signup before canceling booking!');
  }

  const storedCalendar = await Calendar.find({});

  if (!storedCalendar) {
    res.status(400);
    throw new Error('Unable to cancel at this time. Please try later!');
  }

  const dateChosenYear = dateChosen.slice(-2);
  let yearFilter;
  for (let i = 0; i < 2; i++) {
    if (i === 0) {
      const dbCalThisYear =
        storedCalendar[0].dates.thisYearOrganized[0][0].localDate.slice(-2);
      if (dbCalThisYear === dateChosenYear) {
        yearFilter = 'thisYear';
      } else {
        yearFilter = 'nextYear';
      }
    }
  }

  let datesToBeFilterd;
  if (yearFilter === 'thisYear') {
    datesToBeFilterd = storedCalendar[0].dates.thisYearOrganized;
  } else {
    datesToBeFilterd = storedCalendar[0].dates.nextYearOrganized;
  }

  if (yearFilter === 'thisYear') {
    for (let i = 0; i < storedCalendar[0].dates.thisYearOrganized.length; i++) {
      for (
        let j = 0;
        j < storedCalendar[0].dates.thisYearOrganized[i].length;
        j++
      ) {
        if (
          storedCalendar[0].dates.thisYearOrganized[i][j].localDate ===
          dateChosen
        ) {
          for (
            let k = 0;
            k <
            storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots.length;
            k++
          ) {
            if (
              storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[k]
                .time === timeSlot
            ) {
              if (
                storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[k]
                  .reserved === true
              ) {
                storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[
                  k
                ].reserved = false;
                storedCalendar[0].dates.thisYearOrganized[i][j].timeSlots[
                  k
                ].reservedBy = '';
                storedCalendar[0].markModified('dates');
                await storedCalendar[0].save();
              }
            }
          }
        }
      }
    }
  } else {
    for (let i = 0; i < storedCalendar[0].dates.nextYearOrganized.length; i++) {
      for (
        let j = 0;
        j < storedCalendar[0].dates.nextYearOrganized[i].length;
        j++
      ) {
        if (
          storedCalendar[0].dates.nextYearOrganized[i][j].localDate ===
          dateChosen
        ) {
          for (
            let k = 0;
            k <
            storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots.length;
            k++
          ) {
            if (
              storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[k]
                .time === timeSlot
            ) {
              if (
                storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[k]
                  .reserved === true
              ) {
                storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[
                  k
                ].reserved = false;
                storedCalendar[0].dates.nextYearOrganized[i][j].timeSlots[
                  k
                ].reservedBy = '';
                storedCalendar[0].markModified('dates');
                await storedCalendar[0].save();
              }
            }
          }
        }
      }
    }
  }
  res.send(storedCalendar);
});

module.exports = {
  initCalendar,
  updateDateToToday,
  getCalendar,
  reserveTimeSlot,
  unreserveTimeSlot,
};
