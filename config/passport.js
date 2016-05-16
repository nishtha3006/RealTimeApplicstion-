var LocalStrategy    = require('passport-local').Strategy;
var username;

var User       = require('../app/models/user');
var UserInfo   = require('../app/models/userinfo');
module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    //login
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); 
       
        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                
                if (err)
                    return done(err);
                
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                else  
                {       
                    username=new String(email);
                    return done(null, user);
                }
            });
        });

    }));

    //login 
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true 
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); 
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        // create the user
                        var newUser            = new User();
                        newUser.local.email    = email;
                        newUser.local.password = newUser.generateHash(password);
                    
                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });
                        var date=new Date();
                        var newLoggedinUser=new UserInfo();
                        newLoggedinUser.profile.email=email;
                        newLoggedinUser.profile.dateOfLogin=date.getTime();
                        var array=[];
                        array.push({question : 'hello' , date: date.getTime() });
                        newLoggedinUser.profile.sessions.push({questions : array});
                        newLoggedinUser.save(function (err) {
                            if(err)
                                console.log('error in saving');
                        });
                    }

                });
            } else if ( !req.user.local.email ) {
                User.findOne({ 'local.email' :  email }, function(err, user) {
                    if (err)
                        return done(err);
                    
                    if (user) {
                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                    } else {
                        var user = req.user;
                        user.local.email = email;
                        user.local.password = user.generateHash(password);
                        user.save(function (err) {
                            if (err)
                                return done(err);
                            
                            return done(null,user);
                        });
                    }
                });
            } else {
                return done(null, req.user);
            }

        });

    }));

};
