const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db');

app.http("resendInviteLink", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const {email} = req.json();
            if (!email) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Email is required" })
                }
            }
            await connectDb(client);
            
 
        } catch (error) {
            console.error(error, "Error");
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: error.message })
            }
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})