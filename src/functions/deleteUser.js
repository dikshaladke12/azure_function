const { app } = require('@azure/functions');
const { connect_client, closeDb, connectDb } = require("../utils/db");

app.http("deleteUser", {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        console.log(req.query, "egkfdhgdfkhg")
        try {


            const url = new URL(req.url);
            const id = url.searchParams.get("id");
            if (!id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "user Id required"
                    })
                }
            }
            // const bodyText = await req.text();
            // const body = JSON.parse(bodyText);
            // // const id = req.query; 
            // const {id}  = body;
            console.log("Parsed id:", id);
            if (!id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "User ID is required" })
                };
            }

            const userId = parseInt(id);
            if (isNaN(userId)) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "User ID must be a valid number" })
                };
            }

            await connectDb(client);
            const query = `DELETE FROM users WHERE id = $1 RETURNING *`;
            const values = [userId];
            const result = await client.query(query, values);

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "User not found" })
                };
            }

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({ message: "User deleted", body: result.rows[0] })
            };
        } catch (error) {
            context.log("Error:", error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: error.message })
            };
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
});
