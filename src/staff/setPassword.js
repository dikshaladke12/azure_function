const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db');
const bcrypt = require('bcrypt')
const crypto = require('crypto');
const { json } = require('stream/consumers');

app.http("setPassword", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const url = new URL(req.url);
            const resetToken = url.searchParams.get("resetToken");

            const { password } = await req.json();
            if (!password || !resetToken) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "all fields are required"
                    })
                }
            }
            await connectDb(client);
            const tokenResult = await client.query(
                `
                    SELECT *
                    FROM oneTimeLink
                    WHERE token = $1 AND is_expired=$2
                `,
                [resetToken, false]
            )

            if (tokenResult.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "Invalid token or token expired" })
                }
            }
            const tokenData = tokenResult.rows[0]
            const expiresAt = new Date(tokenData.expires_at)
            const currentTime = new Date()
            if (currentTime > expiresAt) {
                await client.query(
                    `
                        UPDATE oneTimeLink
                        SET is_expired=$1
                        WHERE token=$2
                    `,
                    [true, resetToken]
                )
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "Token expired" })
                }
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await client.query(
                `
                        UPDATE userTable 
                        SET password=$1,invitation_status=$2
                        WHERE id=$3
                    `,
                [hashedPassword, 'accepted', tokenData.user_id]
            )

            await client.query(
                `
                    UPDATE oneTimeLink
                    SET is_expired=$1
                    WHERE token=$2
                `,
                [true, resetToken])

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({ message: "Password set successfully" })
            }


        } catch (error) {
            console.error('Error setting password:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: "An error occurred while setting the password"
                })
            }

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})