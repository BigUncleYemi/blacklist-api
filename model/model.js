var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Blacklist = new Schema({
    MSISDN: {
        type: Number,
        required: true,
        unique: true,
        index:true
    },
    operator: {
        type: String,
        required: true
    },
    categories: String,
    date_updated: {
        type: Date,
        default: Date.now,
        lowercase:true
    }
});

Blacklist.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
      next(new Error('There was a duplicate key error'));
    } else {
      next(error);
    }
  });
  

var Blacklist = mongoose.model('Blacklist', Blacklist);