var express 	= require('express');
var router 		= express.Router();

/************************************** API ROUTES START **************************************/

//Main Router
router.use('/',require('./router'));


// router.use('/hrAdmin',require('./hrAdmin'));
// router.use('/employee',require('./employee'));

module.exports=router