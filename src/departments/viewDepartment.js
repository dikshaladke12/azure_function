const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http('viewDepartment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        console.log("req", req)
        const client = connect_client();
        try {
            const url = new URL(req.url);
            const dept_id = url.searchParams.get("dept_id");

            if (!dept_id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "Department ID is required"
                    })
                }
            }

            await connectDb(client);
            const result = await client.query(
                `
                    SELECT *
                    FROM department
                    WHERE id=$1
                `,
                [dept_id]
            )
            console.log("result", result)
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    data: result.rows[0] || {}
                })
            }

        } catch (error) {
            console.log(`error`, error)
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