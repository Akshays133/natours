const nodemailer = require('nodemailer');

const sendEmail = async (option) => {
    //1) create transporter
    const transporter = nodemailer.createTransport({
        // service: 'Gmail',
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    //2) Define email option
    const mailOptions = {
      from: 'Akshay Sharma <aksh123@gmail.com>',
      to: option.email,
      subject: option.subject,
      text: option.message,
      // html:
    };
    
    //3) Send emails
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;