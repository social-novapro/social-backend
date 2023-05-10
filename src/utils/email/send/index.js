const nodemailer = require('nodemailer');
require('dotenv').config();
const { checktime } = require('../../checktime');
const { v4: uuidv4 } = require('uuid');
const interactEmailSchema = require('../../../schemas/interactEmailSchema');
const { email_user, email_pass } = process.env;

const auth = {
    user: email_user,
    pass: email_pass
}

const transporter = nodemailer.createTransport({
    host: 'mail.gandi.net',
    port: 465,
    secure: true,
    auth: auth,
    tls: {
        ciphers: 'SSLv3',
        minVersion: 'TLSv1.2'
    }
});

async function emailSender({ userID, sendTo, subject, content, htmlElement }) {
    if (!htmlElement.ahref && htmlElement.a) htmlElement.ahref = htmlElement.a
    if (!userID || !sendTo || !subject || !content) return { "status": "error", "error": "Missing required fields "}
    const { h1, p, a, ahref} = htmlElement

    const emailID = uuidv4();

    var email = {
        userID,
        emailID,
        sendTo,
        subject,
        content,
        htmlElement,
        timestamp: checktime(),
    }

    const mailOptions = {
        from: email_user,
        to: email.sendTo,
        subject: email.subject,
        text: email.content,
        html: `
            ${h1 ? `<h1>${h1}</h1>` : ``}
            ${p ? `<p>${p}</p>` : ``}
            ${a ? `<a target="_blank" href="${ahref}">${a}</a>` : ``}
        `
    };
    
    transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            console.error(error);

            const savedEmail = await saveEmail(email, true);

            return {
                "status": "error",
                "error": "Email not sent",
                "db": savedEmail
            }
        } else {
            const savedEmail = await saveEmail(email, false)

            return {
                "status": "success",
                "message": "Email sent",
                "db": savedEmail
            }
        }
    }); 
}

async function saveEmail(email, status) {
    const emailData = await interactEmailSchema.create(
        { 
            _id: email.emailID,
            timestamp: email.timestamp,
            failed: status,
            userID: email.userID,
            email: email.sendTo,
            subject: email.subject,
            content: email.content,
            html: {
                h1: email.htmlElement.h1 || null,
                p: email.htmlElement.p || null,
                a: email.htmlElement.a || null,
            },

        }
    )

    return emailData;
}

async function sendTest() {
    const emailSend = await emailSender({
        userID: "test",
        sendTo: "daniel@novapro.net",
        subject: "Emails Work!",
        content: "Sending a test email with HTML",
        htmlElement: {
            h1: "Test with HTML",
            p: "Sending a test email with HTML",
            a: "https://interact.novapro.net/"
        }
    })
    return;
}

module.exports = { emailSender, sendTest }
