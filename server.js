var express = require('express');
var mongoose = require('mongoose');
var bodyparser = require('body-parser');
var app = express();
var route = require('./route/route');
var fs = require('fs');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// var configDB = require('./config/database.js');

var port = process.env.PORT || (process.argv[2] || 3001);
port = (typeof port === "number") ? port : 3001;

var server = app.listen(port);
console.log("Application started. Listening on port:" + port);

module.exports = {
    server : server,
    app : app
};

app.set('view engine', 'ejs'); 

var mongoUri = 'mongodb://base:base@ds163418.mlab.com:63418/blacklistapi';
mongoose.connect(mongoUri);
var db = mongoose.connection;
console.log(db)
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoUri);
});

app.use('/assets', express.static(__dirname + '/public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)

// required for passport
if(app.get('env') === 'development'){
  console.log('DEVELOPMENT ENVIRONMENT for app');
  app.use(session({
      secret: 'i-koos-Seun',
      resave: false,
      saveUninitialized: true
  }));
}
else {
  console.log('PRODUCTION ENVIRONMENT for app');
  app.use(session({
  store: new MongoStore({
      url: 'mongodb://base:base@ds163418.mlab.com:63418/blacklistapi',
      autoRemove: 'interval',
      autoRemoveInterval: 1 // In minutes. Default
  }),
  secret: 'i-koos-Seun',
  resave: false,
  saveUninitialized: true
}));
}// session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

route(app, passport);
require('./config/passport')(passport);

app.use(function (req, res) {
  res.status(404).render('404.ejs')
});

app.use(function(err, req, res, next){
  console.log(`Error -> ${err}`);
  res.send(`There is a problem somewhere but we are on it`);
});

require('./model/model');
