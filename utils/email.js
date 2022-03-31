const nodemailer = require('nodemailer');
// 

module.exports.mail=async function(email,otp,name) {

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pitchgooglid@gmail.com',
    pass: 'pitch@123456#',
  }
});

let mailOptions = {
  from: 'pitchgooglid@gmail.com',
  to: email,
  subject: 'This Mail Is Form Curd Api Project',
  html: ` Welcome ${name} To Our App <br>
        And This Is Your Code =${otp}  ` 
};

transporter.sendMail(mailOptions, function(err, data) {
  if (err) {
    console.log("Error " + err);
  } else {
    console.log("Email sent successfully");
  }
});
}
//enable less security app in google 
//link is this : https://www.google.com/settings/security/lesssecureapps
