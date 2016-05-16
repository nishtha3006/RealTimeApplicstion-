var mongoose = require('mongoose');
var userSchema = mongoose.Schema({

	        profile      : {
		        email        : String,
		        dateOfLogin  : Number,
		        sessions	 :[{
			        questions    : [{
			        		question  : String,
			        		date      : Number
			        	}]
			        }]
	    	}
	},
    {
      collection: 'userInfo'
	}
 );
module.exports=mongoose.model('userInfo',userSchema);
