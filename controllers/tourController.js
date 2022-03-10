const Tour = require('./../models/tourModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError')
const factory = require('./handleFactory');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.select = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty'
  next();
}



exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour)
exports.deleteTour = factory.deleteOne(Tour);
  // console.log(req.body);

  // const newId = tours[tours.length - 1].id + 1;
  // const newTour = Object.assign({ id: newId }, req.body);

  // tours.push(newTour);

  // fs.writeFile(
  //   `${__dirname}/dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   err => {
  //     res.status(201).json({
  //       status: 'success',
  //       data: {
  //         tour: newTour
  //       }
  //     });
  //   }
  // );


// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
  
//   if (!tour) {
//     return next(new AppError('No tour found with this ID', 404));
//   }
  
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { rating: { $gte: 4.5 } }
    },
    {
      $group: { 
        _id: { $toUpper: '$difficulty' },
        numTour: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
        }
    },
    {
      $sort: { avgPrice: 1 }
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: { startDates: { 
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
        } }
    },
    {
      $group: { 
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        Tours: { $push: '$name' }
        }
    },
    {
      $addField: { month: '$_id' }
    },
    {
      $project: { _id: 0 }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  
  res.status(200).json({
    status: 'success',
    data: {
      plan
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  
  const radius = unit === 'mil' ? distance / 3963.2 : distance/ 6378.1; //if unit is in KM
  
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });
  
  if(!lat || !lng) {
    next(new AppError('Please provide the correct longitude and latitude in format lat,lng', 400));
  }
  
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
});

exports.getDistances = catchAsync(async (req, res, next) => {
   const { latlng, unit } = req.params;
   const [lat, lng] = latlng.split(',');

   if (!lat || !lng) {
     next(
       new AppError(
         'Please provide the correct longitude and latitude in format lat,lng',
         400
       )
     );
   }
   
   const multiplier = unit === 'mil' ? 0.000621371  : 0.001; //if unit is in KM

   const tours = await Tour.aggregate([
     {
       $geoNear: {
         near: {
           type: 'Point',
           coordinates: [lng, lat]
         },
         distanceField: 'distance', 
         distanceMultiplier: multiplier
       }
     },{
       $project: { 
         distance: 1, 
         name: 1,
       }
     }
   ]);


   res.status(200).json({
     status: 'success',
     data: {
       data: tours,
     },
   });
});



//  //1A) FILTERING
//     const queryObj = {...req.query}
//     const excludedFields = ['page', 'sort', 'limit', 'fields']
//     excludedFields.forEach(el => delete queryObj[el])
    
//     //1B) ADVANCE FILTERING
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(lte|lt|gte|gt)\b/g, match => `$${match}`);
//     // console.log(queryStr);
    
//     let query = Tour.find(JSON.parse(queryStr));
    
    
//     //2) SORTING
//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(',').join(' ');
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort('-createdAt');
//     }
    
//     //3) FIELDS LIMITING
//     if(req.query.fields) {
//       const fields = req.query.fields.split(',').join(' ');
//       query = query.select(fields);
//     } else {
//       query = query.select('-__v');
//     }
    
//     // 4) PAGINATION
//     const page = req.query.page * 1 || 1;
//     const limit = req.query.limit * 1 || 100;
//     const skip = (page - 1) * limit;
    
//     query = query.skip(skip).limit(limit);
    
//     if (req.query.page) {
//       const numTour = await Tour.countDocuments();
//       if (skip >= numTour) throw new Error('This is not exist');
//     }
   