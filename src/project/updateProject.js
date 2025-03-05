const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http("updateProject", {
    methods: ["PUT"],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);

            const url = new URL(req.url);
            const project_id = url.searchParams.get("project_id");
            let { project_name, project_number, description, address, project_manager_id, start_date, end_date } = await req.json();

            if (!project_id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "Project ID is required"
                    })
                };
            }
            if ((!project_name || project_name.trim() === '') && address) {
                project_name = address;
            }

            if (!project_number || !project_manager_id || !start_date) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        message: "All fields are required"
                    })
                }
            }

            const result = await client.query(
                `
                    UPDATE project
                    SET project_name=$1, project_number=$2, description=$3, address=$4, project_manager_id=$5, start_date=$6, end_date=$7, updated_at=NOW()
                    WHERE id=$8 AND is_deleted = false
                `,
                [project_name, project_number, description, address, project_manager_id, start_date, end_date, project_id]
            )
            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({
                        error: "Project not found"
                    })
                }
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "Project updated successfully"
                })
            }

        } catch (error) {
            console.error("Error while updating project", error);
            return context.res = {
                status: 500,
                body: JSON.stringify({
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