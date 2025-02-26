const { app } = require("@azure/functions")
const { connectDb, closeDb, connect_client } = require('../tables/db')
const bcrypt = require('bcrypt')

app.http('resetPassword1', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        console.log('req',req)
        const client = connect_client();
        try {
            const url = new URL(req.url);
            const resetToken = url.searchParams.get("resetToken");
            
            const { newPassword } = await req.json()

            if (!resetToken || !newPassword) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Token or new password is required" })
                }
            }
            await connectDb(client)

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
            console.log('tokenDataa', tokenData)
            const expiresAt = new Date(tokenData.expires_at)
            const currentTime = new Date()

            if (currentTime > expiresAt) {
                await client.query(
                    `
                    UPDATE oneTimeLink
                    SET is_expired=$1
                    WHERE token=$2
                    `,
                    [true,resetToken]
                )
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "Token expired" })
                }
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            //update Password
            await client.query(
                `
                        UPDATE userTable 
                        SET password=$1
                        WHERE id=$2
                    `,
                [hashedPassword, tokenData.user_id]
            )

            //update is_expired is true after use
            await client.query(
                `
                    UPDATE oneTimeLink
                    SET is_expired=$1
                    WHERE token=$2
                `,
                [true, resetToken]
            )

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({ message: "Password reset successfully" })
            }

        } catch (error) {
            context.log("Error:", error)
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: error.message })
            }

        } finally {
            if (client) {
                await closeDb(client)
            }
        }
    }

})