const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http('assignStaffToDept', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);
            const { department_id, staff_ids } = await req.json();

            if (!department_id || !staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({ error: 'Department ID and a list of staff IDs are required' })
                };
            }

            const checkDept = await client.query(
                `SELECT * FROM department WHERE id = $1`,
                [department_id]
            );
            if (checkDept.rowCount === 0) {
                return context.res = {
                    status: 404,
                    body: JSON.stringify({ error: 'Department not found' })
                };
            }

            const validStaffQuery = `
                SELECT id 
                FROM userTable 
                WHERE id = ANY($1) AND is_staff = true AND is_active = true AND is_deleted = false
            `;
            const validStaffResult = await client.query(validStaffQuery, [staff_ids]);
            const validStaffIds = validStaffResult.rows.map(row => row.id);

            const invalidStaffIds = staff_ids.filter(id => !validStaffIds.includes(id));

            if (validStaffIds.length === 0) {
                return context.res = {
                    status: 404,
                    body: JSON.stringify({
                        error: 'No valid staff members found',
                        invalid_staff_ids: invalidStaffIds
                    })
                };
            }

            const insertValues = validStaffIds.map((staff_id, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(',');
            const queryParams = validStaffIds.flatMap(staff_id => [staff_id, department_id]);

            const insertQuery = `
                INSERT INTO staff_departments (staff_id, department_id) 
                VALUES ${insertValues} 
                ON CONFLICT DO NOTHING 
                RETURNING *;
            `;

            const insertResult = await client.query(insertQuery, queryParams);

            return context.res = {
                status: 200,
                body: JSON.stringify({
                    status: 200,
                    success: true,
                    message: `${insertResult.rowCount} staff members assigned to department`,
                    assigned_staff_ids: validStaffIds,
                    invalid_staff_ids: invalidStaffIds
                })
            };

        } catch (error) {
            console.error('Error assigning staff:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: 'Internal Server Error' })
            };
        } finally {
            if (client) {
                await closeDb(client);
            }

        }
    }
});
