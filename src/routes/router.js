const express=require('express')
const router=express.Router()
const controller=require('../controllers/userController')
const { verifyTokenFn }=require('../../utils/jwt')

router.post('/createNewUser',controller.createNewUser)
router.post('/login',controller.login)

router.post('/forgotPassword',controller.forgotPassword)
router.post('/forgotChangePassword',controller.forgotChangePassword)

router.get('/userProfile',verifyTokenFn,controller.userProfile)

router.put('/updateProfile',verifyTokenFn,controller.updateProfile)
router.post('/changePassword',verifyTokenFn,controller.changePassword)

module.exports=router;
