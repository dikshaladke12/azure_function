const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http("getProject", {
    methods: ["GET"],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client)
            const url = new URL(req.url)
            const project_id = url.searchParams.get("project_id")
            if (!project_id) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({
                        error: "Project ID is required"
                    })
                }
            }
            const result = await client.query(
                `
                    SELECT * 
                    FROM project 
                    WHERE id = $1 AND is_deleted = false
                `, [project_id]
            )
            if (result.rows.length === 0) {
                return context.res = {
                    status: 404,
                    body: JSON.stringify({
                        error: "Project not found"
                    })
                }
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify(result.rows[0])
            }

        } catch (error) {
            console.error("Error getting project:", error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: 'An error occurred while getting project'
                })
            }

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})