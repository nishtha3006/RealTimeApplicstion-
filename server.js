var express  = require('express');
var app      = express();
var http	 =require('http').Server(app);
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var io       =require('socket.io')(http);
var passportSocketIo = require('passport.socketio');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var mongoStore   = require('connect-mongo/es5')(session);

var configDB     = require('./config/database.js');
var Message;
// configuration ===============================================================
mongoose.connect('mongodb://localhost/New'); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating
var memStore=new mongoStore({mongooseConnection: mongoose.connection});
app.use(session({ secret: 'itsmysecret',
				  key : 'app.sid',
				  saveUnintialized: true,
				  resave: true,
				  store: memStore
				  })); // session secret

app.use(passport.initialize());
app.use(passport.session({secret: 'itsmysecret', key:'app.sid', store: memStore})); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./app/routes.js')(app,passport);
var UserInfo  = require('./app/models/userinfo');
var Que   = require('./app/models/questions.js');
var query = ["What is zero divided by zero?","When is the world going to end?","i m sleepy",
			"Make me a sandwich","Sing me a song","Can i borrow some money","blah blah blah blah",
			"Do I look fat in this?","Is santa real","What should I wear for Halloween?"];
var ans   = ["Indetermined","As long as you keep me connected we should be just fine",
			"Put down lappy, take a nape. I will be here","Can't. Don't have bread :p",
			"Rather i would like to die","You son of a bitch.U still haven't returned the jug i lent you",
			"That is a nice song!!!","On a scale of 1 to 10, I'll bet you're a 42",
			"I will pretend that u didnt ask this question","Be yourself pumpkin"];
var message;
var questions=[];
var username;
io.use(passportSocketIo.authorize({
  key				: 'app.sid',
  secret			: 'itsmysecret',
  store       		: memStore,
  passportSocketIo	: passport,
  cookieParser		: cookieParser,
  success           : onAuthorizeSuccess,
  fail              : onAuthorizeFail 
}));
function onAuthorizeSuccess(data, accept){  
  console.log('successful connection to socket.io');
  accept(); //Let the user through
}
function onAuthorizeFail(data, message, error, accept){ 
  if(error) accept(new Error(message));
  console.log('failed connection to socket.io:', message);
  accept(null, false);  
}
io.on('connection',function (socket) {
	console.log('a user connected');
	console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
	if(socket.request.user!=undefined)
	console.log(socket.request.user);
	socket.on('disconnect', function(){
		console.log()
		UserInfo.findOne({ 'profile.email' : socket.request.user.local.email },function (err,docs) {
			console.log(docs);
			if(docs!=null){
				if(questions.length!=0){
					docs.profile.sessions.push({questions : questions});
					docs.save(function (err) {
						if(err)
							console.log('err in saving after updating');
						else{
							console.log('successfully updated and saved');
						}
					});
				}
			}
			console.log(docs);
		});
    	console.log('user disconnected');
 	 });
	socket.on('question',function (info) {
		console.log('This is question asked by the user :'+info.msg);
		Que.find({'query.question': info.msg},function (err , docs) {
			console.log('Docs : '+docs);
			if(err){
				message='Question not found';
				console.log('there is error');
			}
			else if(docs!=null && docs.length!=0){
				console.log('Answer : '+docs[0].query.ans);
				questions.push({question : info.msg , date: new Date().toISOString() });
				console.log('Questions : '+questions);
				socket.emit('answer','Ans : '+docs[0].query.ans);
		   	}else{
		   		console.log('right position');
		   		socket.emit('answer','QUESTION NOT FOUND');
		   	}
		});
	});
});
http.listen(port);
console.log('The magic happens on port ' + port);
function addQuestions(argument) {
 	console.log('in the function');
	for(var i=0 ; i<10 ; i++){
		var temp=new Que();
		console.log(query[i]);
		console.log(ans[i]);
		temp.query.question=query[i];
		temp.query.ans=ans[i];
		temp.save(function (err) {
			if(err)
			 console.log('err in saving');
		});
	}
 } 