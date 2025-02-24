const { app } = require('@azure/functions');
const { connectDb, connect_client, closeDb } = require("../utils/db");

app.http('updateUser', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const bodyText = await req.text();
            console.log("bodytext", bodyText);
            let body;
            try {
                body = JSON.parse(bodyText);
            } catch (error) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Invalid JSON format" })
                };
            }
            console.log("body", body);
            const { id, name, email, age } = body;

            if (!id || !name || !email || !age) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All the fields are required"
                    })
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

            const query = `
                UPDATE users 
                SET name =$1, email =$2, age=$3 
                WHERE id = $4
                RETURNING *
            `

            const values = [name, email, age, userId]

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