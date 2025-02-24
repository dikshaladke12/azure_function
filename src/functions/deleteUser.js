const { app } = require('@azure/functions')
const { connect_client, closeDb, connectDb } = require("../utils/db");
const { Query } = require('pg');

app.http("deleteUser", {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async function (context, req) {
        const client = connect_client();
        try {
            const { id } = req.query;
            if (!id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "user Id required"
                    })
                }
            }

            await connectDb(client);
            const query = new Query(`DELETE FROM users WHERE id = $1 RETURNING *`);
            const values = [id]
            const result = await client.query(query, values);

            if (result.rowCount == 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({
                        error: 'user not found'
                    })
                }
            }

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "User deleted",
                    body: result.rows[0]
                })
            }


        } catch (error) {
            context.log('error', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
        }
        finally {
            if (client) {
                await closeDb(client)
            }
        }
    }
})