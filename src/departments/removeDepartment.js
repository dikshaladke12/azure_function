const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')


app.http("removeDepartment", {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        console.log("req", req);
        const client = connect_client();
        try {
            const url = new URL(req.url);
            const id = url.searchParams.get("id");
            if (!id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "Department ID is required"
                    })
                }
            }
            const deptID = parseInt(id);
            if (isNaN(deptID)) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "User ID must be a valid number" })
                };
            }

            await connectDb(client);
            
            const checkQuery = `SELECT is_deleted FROM department WHERE id = $1`;
            const checkResult = await client.query(checkQuery, [deptID]);

            if (checkResult.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "Department not found" })
                };
            }

            if (checkResult.rows[0].is_deleted) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "Department is already deleted" })
                };
            }
            
            const query =`UPDATE department SET is_deleted = TRUE WHERE id = $1 RETURNING *`
            const values = [deptID];
            const result = await client.query(query, values);

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "department not found" })
                };
            }

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "department deleted",
                    body: result.rows[0]
                })
            };

        } catch (error) {
            console.error('Error removing department:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    message: "Error removing department",
                    error: error.message
                })
            }

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})
