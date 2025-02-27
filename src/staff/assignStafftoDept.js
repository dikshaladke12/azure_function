const { app } = require('@azure/functions');
const { connect_client, connectDb, closeDb } = require('../tables/db');

app.http("assignStaffToDept", {
    methods: ["POST"],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);
            const { department_id, staff_id } = await req.json();
            if (!department_id || !staff_id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: 'Department ID and Staff ID are required' })
                }
            }
            const checkStaffId = await client.query(
                `   SELECT * 
                    FROM userTable 
                    WHERE id = $1 AND is_staff = true AND is_active = true AND is_deleted = false
                `, [staff_id]
            );

            if (checkStaffId.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: 'Active staff not found or staff is deleted' })
                };
            }
            // const checkStaffId = await client.query(
            //     `   SELECT * 
            //         FROM userTable 
            //         WHERE id = $1 AND is_staff = true
            //     `, [staff_id]
            // )
            // if (checkStaffId.rowCount === 0) {
            //     return context.res = {
            //         status: 404,
            //         success: false,
            //         body: JSON.stringify({ error: 'Staff not found' })
            //     }
            // }
            const checkDeptId = await client.query(
                `   SELECT * 
                    FROM department 
                    WHERE id = $1
                `, [department_id]
            )
            if (checkDeptId.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: 'Department not found' })
                }
            }

            const result = await client.query(
                `
                    INSERT INTO staff_departments (department_id, staff_id)
                    VALUES ($1, $2)
                    RETURNING *
                `, [department_id, staff_id]
            )
            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: 'Staff not assigned to the department' })
                }
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: 'Staff assigned to department'
                })

            }

        } catch (error) {
            console.log('error: ', error)
            return context.res = {
                status: 500,
                success: false,
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