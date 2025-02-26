const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http("updateUserDetails", {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const bodyText = await req.text();
            let body;
            try {
                body = JSON.parse(bodyText)
            } catch (error) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Invalid JSON format" })
                }
            }
            const { id, first_name, last_name } = body;
            if (!id || !first_name || !last_name) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "All the fields are required" })
                }
            }
            const userId = parseInt(id);
            if (isNaN(userId)) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify(
                        { error: "User ID must be a valid number" }
                    )
                }
            }
            await connectDb(client);

            const query = `UPDATE userTable
            SET first_name=$1, last_name=$2
            WHERE id=$3 RETURNING *`;
            const values = [first_name, last_name, userId];
            const result = await client.query(query, values);

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "User not found" })
                }
            }

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "User updated",
                    body: result.rows[0]
                })
            }

        } catch (error) {
            context.log("error", error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
        } finally {
            if (client) {
                await closeDb(client)
            }
        }
    }
})