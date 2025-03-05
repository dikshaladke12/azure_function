const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http("deleteProject", {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        console.log(req)
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

            const result = await client.query(`
                UPDATE project
                SET is_deleted = true
                where id = $1
            `, [project_id]);

            if (result.rowCount === 0) {
                const checkResult = await client.query(
                    `SELECT is_deleted FROM project WHERE id = $1`,
                    [project_id]
                );

                if (checkResult.rows.length > 0 && checkResult.rows[0].is_deleted) {
                    return context.res = {
                        status: 200,
                        body: JSON.stringify({
                            message: "project already deleted"
                        })
                    };
                } else {
                    return context.res = {
                        status: 404,
                        body: JSON.stringify({
                            error: "project not found"
                        })
                    };
                }
            }

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "Project deleted successfully"
                })
            }

        } catch (error) {
            console.error('Error fetching projects:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: 'An error occurred while deleting projects'
                })
            }

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
});