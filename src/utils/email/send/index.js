const nodemailer = require('nodemailer');
require('dotenv').config();
const { checktime } = require('../../checktime');
const { v4: uuidv4 } = require('uuid');
const interactEmailSchema = require('../../../schemas/emails/interactEmailSchema');
const interactUserSchema = require('../../../schemas/interactUserSchema');
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

// users is an array of objects with userID and email or just userID
async function emailSender({ users, subject, content, htmlElement }) {
    if (!htmlElement.ahref && htmlElement.a) htmlElement.ahref = htmlElement.a
    if (!htmlElement.a && htmlElement.ahref) htmlElement.a = htmlElement.ahref
    if (!users || !subject || !content ) return { "status": "error", "error": "Missing required fields "}
    
    const { h1, p, a, ahref } = htmlElement;
    const emailID = uuidv4();

    const mailOptions = {
        from: email_user,
        to: [],
        bcc: [],
        subject,
        text: content,
        html: `
            ${h1 ? `<h1>${h1}</h1>` : ''}
            ${p ? `<p>${p}</p>` : ''}
            ${a ? `<a target="_blank" href="${ahref}">${a}</a>` : ''}
        `
    };

    const email = {
        emailID,
        sendTo: [],
        subject,
        content,
        htmlElement,
        timestamp: checktime(),
    }
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (!user.userID) break;

        // const userFound = true; // testing
        const userFound = await interactUserSchema.findOne({ _id: user.userID })
        if (userFound) {
            if (user.email) {
                if (user.bcc) mailOptions.bcc.push(user.email)
                else mailOptions.to.push(user.email)

                email.sendTo.push({ 
                    userID: user.userID,
                    email: user.email,
                    failed: false,
                    isBCC: user.bcc || false,
                });
            }
        }
    }
  

    transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
            console.error(error);
            const savedEmail = await saveEmail(email, true);

            returnData = {
                "status": "error",
                "error": "Email not sent",
                "db": savedEmail
            }
        } else {
            const savedEmail = await saveEmail(email, false)

            returnData =  {
                "status": "success",
                "message": "Email sent",
                "db": savedEmail
            }
        }
    })

    return {
        "status": "completed",
        "emailID": emailID
    };
}


async function saveEmail(email, status) {
    const emailData = await interactEmailSchema.create({ 
        _id: email.emailID,
        timestamp: email.timestamp,
        failed: status,
        subject: email.subject,
        content: email.content,
        html: {
            h1: email.htmlElement.h1 || null,
            p: email.htmlElement.p || null,
            a: email.htmlElement.a || null,
        }
    })

    for (let i = 0; i < email.sendTo.length; i++) {
        const user = email.sendTo[i];
        await emailData.users.push({
            _id: user.userID,
            failed: status,
            email: user.email,
            isBCC: user.isBCC,
        })
    }

    await emailData.save()

    return emailData;
}

async function testing() {
    const emailSend = await emailSender({
        users: [
            {
                userID: "test",
                email: "daniel@novapro.net",
                bbc: true
            },
            {
                userID: "test2",
                email: "daniel@dkravec.net",
                bbc: false
            }
        ],
        type: 00,
        subject: "Multiple senders! BCC",
        content: "Sending a test email with multiple senders",
        htmlElement: {
            h1: "Test with Senders",
            p: "Sending a test email with multiple senders",
            a: "https://interact.novapro.net/"
        }
    })

    return ;
}

async function sendTest() {
    // await testing()
}

module.exports = { emailSender, sendTest }