const sgMail=require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeMail= (email,name)=>{
    
    sgMail.send({
        to: email,
        from: 'orr600@gmail.com',
        subject: 'Thanks for joining in',
        text: `Welcome to the app ${name}, let me know how you get along with the app`
    }) 
}

const sendCancelationMail= (email,name)=>{
    console.log(email,name)
    sgMail.send({
        to: email,
        from: 'orr600@gmail.com',
        subject: 'Sorry to see you leave us!',
        text: `Goodbye ${name}, we hope to see you again`
    }) 
}
module.exports={
    sendWelcomeMail,
    sendCancelationMail

} 