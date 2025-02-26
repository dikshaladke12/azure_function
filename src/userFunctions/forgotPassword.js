require('dotenv').config();
const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db');
const { oneTimeLink } = require('../tables/oneTimeLink')
const crypto = require('crypto');

const {transporter} = require('../utils/transporter');

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
            await oneTimeLink()

            const result = await client.query('SELECT * FROM userTable WHERE email = $1', [email]);

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "User not found" })
                }
            }

            const userId = result.rows[0].id;

            const resetToken = crypto.randomBytes(32).toString('hex');
            // const resetTokenExpires = new Date(Date.now() + 3600000);
            const resetTokenExpires = new Date(Date.now() + 60000); //2min

            const existingToken = await client.query(`
                    SELECT *
                    FROM oneTimeLink
                    WHERE user_id =$1
                `, [userId])

            if (existingToken.rowCount > 0) {
                await client.query(`
                    UPDATE oneTimeLink
                    SET token=$1, expires_at=$2, code_type=$3, is_expired= $4
                    WHERE user_id=$5
                `, [resetToken, resetTokenExpires, 'forgot-password', false, userId])
            }
            else {
                await client.query(`
                    INSERT INTO oneTimeLink (user_id, token, expires_at, code_type, is_expired)
                    VALUES ($1, $2, $3, $4, $5)
                `, [userId, resetToken, resetTokenExpires, 'forgot-password', false])
            }

            const reset_link = `http://localhost:7071/api/resetPassword1?resetToken=${resetToken}`;

            await transporter.sendMail({
                from: `Diksha Ladke ${process.env.SMTP_USER}`,
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