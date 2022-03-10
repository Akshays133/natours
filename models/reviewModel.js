const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'Review cannot empty!']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now()
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to tour!']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user.']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.static.calcAverageRating = async function(tourId) {
    const stats = await this.aggregate([
        { 
            $match: { tour: tourId }
        },
        {    
            $group: { 
                _id: '$tour',
                nRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
          ratingsQuantity: 0,
          ratingsAverage: 4.5,
        });
    }
};

reviewSchema.post('save', function() {
    /// This represt the Schema
    await this.constructor.calcAverageRating(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    /// await this.findOne() not work here because query is already executed
    await this.r.constructor.calcAverageRating(this.r.tour);
})



//QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function(next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;