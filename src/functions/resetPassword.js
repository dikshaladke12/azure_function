const { app } = require('@azure/functions')
const { connectDb, connect_client, closeDb } = require('../utils/db');
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')


app.http("resetPassword", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const body = await req.text();
            const { resetToken, newPassword } = JSON.parse(body);

            if (!resetToken || !newPassword) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Reset token and new password are required" })
                }
            }
            await connectDb(client);

            const query = `SELECT * from users WHERE reset_token =$1 AND reset_token_expiry>NOW()`;
            const result = await client.query(query, [resetToken]);

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "Invalid reset token or token expired" })
                }
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const updateQuery = `UPDATE users SET password = $1, reset_token =null , reset_token_expiry =null WHERE reset_token =$2`
            await client.query(updateQuery, [hashedPassword, resetToken]);
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({ message: "Password reset successfully" })
            }
        } catch (error) {
            context.log('error', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: error.message })
            }
        }
    }
})