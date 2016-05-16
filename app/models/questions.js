var mongoos=require('mongoose');
var userSchema = mongoos.Schema({
	query : {
		question : String,
		ans      : String
	}
	},{
		collection : 'realQuestion'
	}
);
module.exports = mongoos.model('real',userSchema);