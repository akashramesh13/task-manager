const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'akashvanced420@gmail.com',
        subject: 'Welcome to the Tasks Manager API',
        text: `Hello, ${name}! Welcome to the Task Manager API - app. Please rate thanks`
    })
}

const sendCancellationEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'akashvanced420@gmail.com',
        subject: 'Sorry to see you go - Task Manager API',
        text: `Goodbye, ${name}, Sorry to see you go. Could you take a moment to tell us what we could improve on?`
    })
}

console.log('email sent successfully');

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}