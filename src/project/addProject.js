const { app } = require('@azure/functions');
const { connect_client, connectDb, closeDb } = require('../tables/db')
const { project } = require('../tables/project')
app.http("addProject", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        console.log(req)
        try {
            await connectDb(client);
            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            let { project_name, project_number, description, address, project_manager_id, start_date, end_date, project_timeline } = body

            // If project_name is missing or empty and address is provided, default project_name to address
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
            await project();

            const checkManager = await client.query(
                `
                    SELECT * 
                    FROM userTable
                    WHERE id=$1 AND is_manager= true
                `, [project_manager_id]
            )
            if (checkManager.rowCount === 0) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        message: "Project manager not found in list"
                    })
                };
            }
            const checkTimeline = await client.query(
                `
                    SELECT * 
                    FROM project_timeline
                    WHERE id=$1
                `, [project_timeline]
            )
            if (checkTimeline.rowCount === 0) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        message: "Invalid project timeline ID"
                    })
                }
            }

            const query = `
                INSERT INTO project (project_name, project_number, description, address, project_manager_id, start_date, end_date, project_timeline)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING *
            `;
            const values = [project_name, project_number, description, address, project_manager_id, start_date, end_date, project_timeline]
            const result = await client.query(query, values);
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "Project added successfully",
                    body: result.rows[0]
                })
            }

        }
        catch (error) {
            console.error('Error fetching projects:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: 'An error occurred while fetching projects'
                })
            }
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})