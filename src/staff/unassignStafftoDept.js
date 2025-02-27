const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db');

app.http("unAssignedStaffToDept", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);
            const { department_id, staff_id } = await req.json();
            if (!department_id || !staff_id) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({
                        error: 'Department ID or Staff ID is required'
                    })
                }
            }
            const result = await client.query(
                `
                    DELETE FROM staff_departments 
                    WHERE department_id = $1 AND staff_id = $2
                    RETURNING *
                `, [department_id, staff_id]
            )
            if (result.rowCount === 0) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: 'Staff not found in the department'
                    })
                }
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: 'Staff unassigned from department'
                })
            }

        } catch (error) {
            console.error('Error while getting unassigned staff', error);
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