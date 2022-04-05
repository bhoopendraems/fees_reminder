const connection = require('../../database/connection')
var bcrypt = require('bcryptjs');
const otpGenerator = require('otp-generator')
const sendEmail = require('../../utils/email')
const sendSms = require('../../utils/sentSms')
//const forgotSendEmail = require('../utils/forgotEmail')
const { issueJWT } = require('../../utils/jwt')

module.exports.createNewUser = async (req, res) => {
    try {
        let {
            first_name,
            last_name,
            email,
            phone,
            password,
            confirm_password
        } = req.body

        console.log(req.body, "body data")
        let checkUser = await connection.query(
            `select * from users where email = '${email}' `
        )
        phone = '+91' + phone
        console.log(phone)
        if (checkUser.rows.length == 0) {
            if (password == confirm_password) {
                let salt = await bcrypt.genSaltSync(10);
                let hashPassword = await bcrypt.hash(password, salt)
                let otp = otpGenerator.generate(6, {
                    upperCaseAlphabets: false,
                    specialChars: false,
                    lowerCaseAlphabets: false
                });
                console.log(otp, "otp");
                let newUserData = await connection.query(
                    `insert into users(email,first_name,last_name,phone,password,code,is_verified) 
                    values('${email}','${first_name}','${last_name}','${phone}','${hashPassword}','${otp}','false')`)
                console.log(newUserData, "new user data")

                let message = `your verification code is ${otp} `
                await sendSms(phone, message)
                res.json({
                    status: true,
                    statusCode: 200,
                    message: 'New User Created Successfully',
                })
            } else {
                res.json({
                    status: false,
                    statusCode: 400,
                    message: 'password not matched with confirm password',

                })
            }
        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'This User Is Already Exits',

            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,
        })
    }
}

module.exports.verifyUser = async (req, res) => {
    try {
        let { email, code } = req.body
        let checkUser = await connection.query(
            `select * from users where email = '${email}'`)
        if (checkUser.rows.length > 0) {
            if (checkUser.rows[0].code == code) {
                let updateUser = await connection.query(`update users set is_verified = 'true', code = null`)
                console.log(updateUser, "uswer")
                if (updateUser.rowCount == 1) {
                    res.json({
                        status: true,
                        statusCode: 200,
                        message: 'User verified Successfully',
                    })
                } else {
                    res.json({
                        status: false,
                        statusCode: 400,
                        message: 'something went wrong',
                    })
                }
            } else {
                res.json({
                    status: false,
                    statusCode: 400,
                    message: 'Invalid OTP',
                })
            }
        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'This Email Address Is Not Valid',
            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,
        })
    }
}

module.exports.login = async (req, res) => {
    try {
        let {
            email, password } = req.body
        let checkUser = await connection.query(
            `select * from users where email = '${email}' `
        )
        console.log(checkUser, "user")
        if (checkUser.rows.length > 0) {
            if (checkUser.rows[0].is_verified == true) {
                let checkPassword = await bcrypt.compare(password, checkUser.rows[0].password)
                console.log(checkPassword, "password");
                if (checkPassword) {
                    // token payload created
                    const payload = {
                        id: checkUser.rows[0].id,
                        email: checkUser.rows[0].email
                    }
                    // token created
                    let token = await issueJWT(payload)
                    res.json({
                        status: true,
                        statusCode: 200,
                        message: 'User Login Successfully',
                        token: token
                    })

                } else {
                    res.json({
                        status: false,
                        statusCode: 400,
                        message: 'You Entered Wrong Password',
                    })
                }
            } else {
                res.json({
                    status: false,
                    statusCode: 400,
                    message: 'user is not verified',
                })
            }

        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'This Email Address Is Not Valid',
            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,
        })
    }
}

module.exports.forgotPassword = async (req, res) => {
    try {
        let { email } = req.body
        let checkUser = await connection.query(
            `select * from users where email = '${email}' `
        )
        if (checkUser.rows.length > 0) {

            let otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                specialChars: false,
                lowerCaseAlphabets: false
            });
            let emailSentToUser = await sendEmail.mail(email, otp, checkUser.rows[0].first_name)
            let updateOtp = await connection.query(
                `update users set code='${otp}' where email='${email}' `
            )
            res.json({
                status: true,
                statusCode: 200,
                message: 'Otp Sended To Your Email Address Successfully',
                otp: otp
            })

        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'This Email Address Is Not Valid',
            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,
        })
    }
}

module.exports.forgotChangePassword = async (req, res) => {
    try {
        let { email, code, password, confirm_password } = req.body
        let checkUser = await connection.query(
            `select * from users where email = '${email}' `
        )
        if (checkUser.rows.length > 0) {
            if (password == confirm_password) {
                if (checkUser.rows[0].code == code) {
                    let salt = await bcrypt.genSaltSync(10);
                    let hashPassword = await bcrypt.hash(password, salt)
                    let updatePassword = await connection.query(
                        `update users set password='${hashPassword}', code = null where email='${email}' `
                    )
                    res.json({
                        status: true,
                        statusCode: 200,
                        message: 'Password Changed Successfully',
                    })
                } else {
                    res.json({
                        status: false,
                        statusCode: 400,
                        message: 'Please Enter A Valid Otp',
                    })
                }
            } else {
                res.json({
                    status: false,
                    statusCode: 400,
                    message: 'password and confirm password not matched',
                })
            }
        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'This Email Address Is Not Valid'
            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,
        })
    }
}

module.exports.userProfile = async (req, res) => {
    try {
        let userId = req.user.id;
        let checkUser = await connection.query(
            `select * from users where id = '${userId}' `
        )
        console.log(checkUser.rows)
        if (checkUser.rows.length > 0) {
            res.json({
                status: true,
                statusCode: 200,
                message: 'User Profile Showed Successfully',
                data: checkUser.rows[0]
            })

        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'User Is Not Valid',

            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,

        })
    }
}

module.exports.updateProfile = async (req, res) => {
    try {
        let userId = req.user.id;
        let {
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state,
            country,
        } = req.body
        console.log(req.body)
        let checkUser = await connection.query(
            `select * from users where id = '${userId}' `
        )
        if (checkUser.rows.length > 0) {
            let updateUser = await connection.query(
                `update users set first_name='${first_name}',last_name='${last_name}',email='${email}',phone='${phone}',address='${address}',
                city='${city}',state='${state}', country='${country}' where id='${userId}' `
            )
            console.log(updateUser, "updateUser")
            res.json({
                status: true,
                statusCode: 200,
                message: 'User Profile updated Successfully',
            })

        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'User Is Not Valid',

            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,
        })
    }
}

module.exports.changePassword = async (req, res) => {
    try {
        let userId = req.user.id;
        let {
            old_password,
            new_password,
            confirm_password
        } = req.body
        let checkUser = await connection.query(
            `select * from users where id = '${userId}' `
        )
        if (checkUser.rows.length > 0) {
            let checkPassword = await bcrypt.compare(old_password, checkUser.rows[0].password)

            if (checkPassword) {
                if (new_password == confirm_password) {
                    let salt = await bcrypt.genSaltSync(10);
                    let hashPassword = await bcrypt.hash(password, salt)
                    let updatePassword = await connection.query(
                        `update users set password='${hashPassword}' 
                        where email='${checkUser.rows[0].email}' `
                    )
                    res.json({
                        status: true,
                        statusCode: 200,
                        message: 'Password Changed Successfully',
                    })
                } else {
                    res.json({
                        status: false,
                        statusCode: 400,
                        message: 'new and old password not matched',
                    })
                }
            } else {
                res.json({
                    status: false,
                    statusCode: 400,
                    message: 'wrong old password',
                })
            }
        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'This Email Address Is Not Valid'
            })
        }
    } catch (error) {
        res.json({
            status: false,
            statusCode: 400,
            error: error.message,

        })
    }
}
module.exports.addStudent = async (req, res) => {
    try {
        let user_id = req.user.id;
  
        const {first_name,last_name, s_class,section,DOB} = req.body
        console.log(req.body, "body data")
        let checkUser = await connection.query(
            `select * from users where id = '${user_id}' `
        )
  
        if (checkUser.rows.length> 0) {
             let newStudentData = await connection.query(
                `insert into students(first_name,last_name,s_class,p_id,section,"DOB") 
                    values('${first_name}','${last_name}','${s_class}','${user_id}','${section}
                    ','${DOB}')`)
             
            
            res.json({
                status: true,
                statusCode: 200,
                message: 'New Student Created Successfully',
            })
        } else {
            res.json({
                status: false,
                statusCode: 400,
                message: 'id not found',

            })
        }
    } 
     catch (error) {
    res.json({
        status: false,
        statusCode: 400,
        error: error.message,
    })
}
}