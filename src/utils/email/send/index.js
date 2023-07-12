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
async function emailSender({ users, type, subject, content, htmlElement }) {
    if (!htmlElement.ahref && htmlElement.a) htmlElement.ahref = htmlElement.a
    if (!htmlElement.a && htmlElement.ahref) htmlElement.a = htmlElement.ahref
    if (!users || !subject || !content ) return { "status": "error", "error": "Missing required fields "}
    
    const { h1, p, a, ahref } = htmlElement;
    const emailID = uuidv4();

    const mainStyle = `style="background-color: rgb(28, 28, 30); padding: 0px; margin: 0;"`;
    const bodyStyle = `style="background-color: rgb(28, 28, 30); padding: 40px; padding-left:20px; padding-right:20px;margin: 0;"`;
    const headerStyle = `style="background-color: rgb(44, 44, 46); padding: 20px; margin: 0;"`;
    const footerStyle = `style="background-color: rgb(44, 44, 46); padding: 20px; margin: 0;"`;
    const colorStyle = `style="color: rgb(255, 255, 255); padding: 0px; margin: 0;"`;
    const headerPStyle = `style="color: rgb(255, 255, 255); padding: 0px; margin: 0; padding-top: 5px;"`;

    const defaultHeader = `
        <div ${headerStyle}>
            <div style="display: inline-flex; align-items: center;">
                <div style="display: flex; align-items: center; border-bottom: 2px solid rgba(39, 113, 240, 0.9);">
                    <table cellpadding="0" cellspacing="0">
                        <tr>
                        <td style="padding: 5px;">
                            <img src="https://interact.novapro.net/favicon.ico" alt="Interact Logo" width="50" height="50" style="vertical-align: middle;">
                        </td>
                        <td style="padding: 5px;">
                            <h1 ${colorStyle}>Interact</h1>
                        </td>
                        </tr>
                    </table>
                </div>
            </div>
            <div style="padding:5px"><p ${colorStyle}>This email is from Interact</p></div>
        </div>
    `;

    const defaultFooter = `
        <div ${footerStyle}>
        ${users.length==1? "<p><<userSection>></p>" : "" }
        <p ${colorStyle}>Interact is a product of Nova Productions</p>
        <ul>
                <li><a ${colorStyle} target="_blank" href="https://interact.novapro.net">Interact Home Page</a></li>
                <li><a ${colorStyle} target="_blank" href="https://novapro.net/privacy/">Interact Privacy</a></li>
                <li><a ${colorStyle} target="_blank" href="https://novapro.net/interact/">Interact Information</a></li>
                <li><a ${colorStyle} target="_blank" href="https://novapro.net/">Nova Productions</a></li>
            </ul>
            <div>
                <p ${colorStyle}>Want to change how you receive these emails?</p>
                <p ${colorStyle}>You can
                    <a ${colorStyle} target="_blank" href="https://interact.novapro.net/?emailSettings">update your settings</a> or
                    <a ${colorStyle} target="_blank" href="https://interact.novapro.net/?emailSettings">unsubcribe from emails</a>
                </p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: email_user,
        to: [],
        bcc: [],
        subject,
        text: content,
        html: `
            <div ${mainStyle}>
                ${defaultHeader}
                <div ${bodyStyle}>
                    ${h1 ? `<h1 ${colorStyle}>${h1}</h1>` : ''}
                    ${p ? `<p ${colorStyle}>${p}</p>` : ''}
                    ${a ? `<a ${colorStyle}target="_blank" href="${ahref}">${a}</a>` : ''}
                </div>
                ${defaultFooter}
            </div>
        `
    };

    const email = {
        emailID,
        type: type || 51,
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

                if (users.length==1) {
                    mailOptions.html = mailOptions.html.replace("<<userSection>>", `<p ${headerPStyle}>This email is for: @${userFound.username}</p>`)
                }

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

            const returnData = {
                "status": "error",
                "error": "Email not sent",
                "db": savedEmail
            }
            
            return returnData;
        } else {
            const savedEmail = await saveEmail(email, false)

            const returnData =  {
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
        type: email.type,
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
                userID: "6427dee1-5939-432f-b41a-aeee97003db6",
                email: "daniel@novapro.net",
                bcc: true
            },
            {
                userID: "6427dee1-5939-432f-b41a-aeee97003db6",
                email: "daniel@dkravec.net",
                bcc: true
            }
        ],
        type: 50,
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