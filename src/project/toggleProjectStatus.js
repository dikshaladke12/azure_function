const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http("projectStatus", {
    methods: ["PUT"],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);
            const url = new URL(req.url);
            const project_id = url.searchParams.get("project_id");
            if (!project_id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        message: "Project ID is required"
                    })
                }
            }

            const result = await client.query(
                `
                    SELECT *
                    FROM project 
                    WHERE id = $1 AND is_deleted = false
                `,[project_id]
            )
            if (result.rows.length === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({
                        message: "Project not found"
                    })
                }
            }
            const status = result.rows[0].is_enable;
            const new_status = !status
            await client.query(
                `
                    UPDATE project 
                    SET is_enable = $1 
                    WHERE id = $2
                `, [new_status, project_id]
            )
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: `Project status has been updated to ${new_status}`
                })
            }

        } catch (error) {
            console.error("Error getting project status:", error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: 'An error occurred while getting project status'
                })
            }

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }

})