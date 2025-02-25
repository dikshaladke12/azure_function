const { app } = require('@azure/functions')
const { connectDb, connect_client, closeDb } = require('../utils/db');
const nodemailer = require('nodemailer')
const crypto = require('crypto');

app.http("forgotPassword1", {
    methods: ['POST'],
    authLevel: 'anonymous',
    headers: {
        'Content-Type': 'application/json'
    },
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const { email } = await req.json()
            if (!email) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Email is required" })
                }
            }

            await connectDb(client);
            const result = await client.query('SELECT * FROM userTable WHERE email = $1', [email]);

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "User not found" })
                }
            }
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000); 

            const updateQuery = `UPDATE userTable SET reset_token=$1, reset_token_expiry=$2 WHERE email = $3`;
            await client.query(updateQuery, [resetToken, resetTokenExpires, email])
            
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'dikshaladke12@gmail.com',
                    pass: 'pisr busv jglb ojcj'
                }
            })

            const reset_link = `http://localhost:7071/resetPassword?resetToken=${resetToken}`;

            await transporter.sendMail({
                from: 'Diksha Ladke <dikshaladke12@gmail.com>',
                to: email,
                subject: 'Reset Password request',
                text: `You requested a password reset. Click the following link to reset your password: ${reset_link}`
            })

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({ message: "Reset password email sent successfully" })
            }

        } catch (error) {
            context.log("Error:", error)
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: error.message })
            }
        }
        finally {
            if (client) {
                await closeDb(client)
            }
        }
    }
})