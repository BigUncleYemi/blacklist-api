var express = require('express'),
    app = express();
var bodyparser = require('body-parser');
var urlencodedparser = bodyparser.urlencoded({
    extended: false
});
var model = require('../model/model');
var mongoose = require('mongoose');
var Blacklist = mongoose.model('Blacklist');
var fs = require('fs');
var formidable = require('formidable');
var csvjson = require('csvjson');
var path = require('path')

module.exports = function (app, passport) {
    app.post('/api/upload', function (req, res) {
        var form = new formidable.IncomingForm();

        form.parse(req);
        form.maxFileSize = 2 * 1024 * 1024 * 1024;
        form.multiples = true;
        form.on('fileBegin', function (name, file) {
            file.path = __dirname + '/uploads/' + file.name;
        });
        form.on('file', function (name, file) {
            console.log('Uploaded ' + file.name);
            var data = fs.readFileSync(path.join(__dirname + '/uploads/' + file.name), {
                encoding: 'utf8'
            });
            var options = {
                delimiter: ',',
                quote: '"'
            };
            var conv = csvjson.toSchemaObject(data, options);
            console.log(conv)

            for (var i = 0; i < conv.length;) {
                var new_blacklist = new Blacklist(conv[i]);
                new_blacklist.save(function (err, results) {
                    if (err) {
                        console.log(`error - ${JSON.stringify(err)}`);
                    }
                })
                i++
            }
        });
        form.on('error', function (err) {
            console.log('an error has occured while uploading')
        });
        console.log(form);
        res.render('api.ejs')

    });

    app.post('/api/sucessful', urlencodedparser, validateUpload, function (req, res, next) {
        var new_blacklist = new Blacklist(req.body);
        new_blacklist.save(function (err, results) {
            if (err) {
                console.log(`error - ${JSON.stringify(err)}`);
                next(err)

            } else {
                Blacklist.count((err, count) => {
                    console.log(`Count - ${count}`);
                });
                console.log(`results - ${JSON.stringify(results)}`);
                res.json({
                    results,
                    message: "Sucessful."
                });
                console.log(req.body)
            }
        })
    });

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/api',
        failureRedirect: '/login',
        failureFlash: true
    }));

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', { message: req.flash('loginMessage') });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/login',
        failureRedirect: '/signup',
        failureFlash: true,
        successFlash: 'You can now Sign-in!'
    }));

    app.get('/api', isLoggedIn, function (req, res) {
        res.render('api.ejs', {
            user: req.user
        });
    });

    app.get('/api/search', function (req, res) {
        res.render('search.ejs');
    });

    app.get('/api/delete', function (req, res) {
        res.render('delete.ejs');
    });

    app.get('/api/update', function (req, res) {
        res.render('update.ejs');
    });

    app.get('/api/search/list', function (req, res) {
        Blacklist.find({}, function (err, results) {
            if (err) {
                res.json({
                    status: false,
                    error: 'could not get list'
                })
            } else {

                res.json({
                    results,
                    message: 'list found'
                })
            }
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        })

    })
    app.get('/api/search/operator', function (req, res) {
        Blacklist.find({
            operator: req.query.operator
        }, function (err, results) {
            if (err) {
                res.json({
                    status: false,
                    error: 'could not find results'
                })
            } else {

                res.json({
                    results,
                    message: 'search completed'
                })
            }
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        })
    })
    app.get('/api/search/MSISDN', function (req, res) {
        Blacklist.find({
            MSISDN: req.query.MSISDN
        }, function (err, results) {
            if (err) {
                res.json({
                    status: false,
                    error: 'could not find results'
                })
            } else {

                res.json({
                    results,
                    message: 'search completed'
                })
            }
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        });
    })
    app.get('/api/search/categories', function (req, res) {
        Blacklist.find({
            categories: req.query.categories
        }, function (err, results) {
            if (err) {
                res.json({
                    status: false,
                    error: 'could not find results'
                })
            } else {

                res.json({
                    results,
                    message: 'search completed'
                })
            }
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        });
    })

    app.put('/api/update/MSISDN', function (req, res) {
        console.log(req);
        console.log(req.body);
        console.log(req.params);
        console.log(req.query);
        Blacklist.findOneAndUpdate({ MSISDN: req.query.MSISDN }, { categories: req.query.categories, operator: req.query.operator }, function (err, results) {
            if (err) {
                res.json({
                    err,
                    error: 'update failed'
                })
            } else {
                res.json({
                    results,
                    message: 'Update Sucessful'
                })
            }
        })
    })
    app.delete('/api/delete/MSISDN/:MSISDN', function (req, res) {

        Blacklist.findOneAndRemove({ MSISDN: req.params.MSISDN }, function (err, results) {
            if (err) {
                res.json({
                    err
                })
            } else {
                res.json({
                    results,
                    message: "Contact deleted "
                })
            }
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        });
    })

    app.delete('/api/delete/operators/:operator', function (req, res) {
        Blacklist.find({ operator: req.params.operator }, function (err, results) {
            if (err) {
                err
            }
            Blacklist.remove(function (err, results) {
                if (err) {
                    res.json({
                        status: false,
                        error: "delete unsucessful."
                    });
                }
                return res.json({
                    results,
                    status: true,
                    message: 'delete sucessful.'
                })
            })
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        });
    })

    app.delete('/api/delete/categories/:categories', function (req, res) {
        Blacklist.find({ categories: req.params.categories }, function (err, results) {
            if (err) {
                err
            }
            Blacklist.remove(function (err, results) {
                if (err) {
                    res.json({
                        status: false,
                        error: "delete unsucessful."
                    });
                }
                return res.json({
                    results,
                    status: true,
                    message: 'delete sucessful.'
                })
            })
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        });
    })

    app.delete('/api/delete/list', function (req, res) {
        Blacklist.find({}, function (err, results) {
            if (err) {
                err
            }
            Blacklist.remove(function (err, results) {
                if (err) {
                    res.json({
                        status: false,
                        error: "delete unsucessful."
                    });
                }
                return

                res.json({
                    results,
                    status: true,
                    message: 'delete sucessful.'
                })
            })
        }).count((err, count) => {
            console.log(`Count - ${count}`)
        });
    })
}

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function validateUpload(req, res, next) {
    var upload = req.body;
    var error = {};
    if (!upload.MSISDN || upload.MSISDN === null) {
        error.msMeg = "MSISDN is missing";
    } else if (!upload.MSISDN.match("^((234)[0-9]{10})$")) {
        error.msMeg = "MSISDN is in wrong format. ensure it is in 234XXXXXXXXXX";
    }
    if (!upload.categories || upload.categories === null) {
        error.categories = "Categories is missing";
    }
    if (!upload.operator || upload.operator === null) {
        error.operator = "Operator is missing";
    }

    if (error.msMeg || error.categories || error.operator) {
        return res.json(error);
    } else {
        next();
    }

}