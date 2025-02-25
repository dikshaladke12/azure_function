const { app } = require('@azure/functions');
const { connect_client, closeDb, connectDb } = require("../utils/db");

app.http("deleteusers", {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
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
            const query = `DELETE FROM userTable WHERE id = $1 RETURNING *`;
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
