const { app } = require('@azure/functions')
const { connect_client, connectDb, closeDb } = require('../tables/db')

app.http("getDepartmentStaff", {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);
            const url = new URL(req.url);
            const department_id = url.searchParams.get('department_id');

            if (!department_id) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({
                        error: 'Department ID is required'
                    })
                }
            }

            const result = await client.query(
                `
                    SELECT u.id, u.first_name, u.last_name, u.email, u.country_code, u.phone, u.invitation_status, r.role_name, d.dept_name, d.description
                    FROM staff_departments as sd
                    JOIN userTable as u ON sd.staff_id = u.id
                    JOIN department as d ON sd.department_id = d.id
                    JOIN roles as r ON u.role_id = r.id
                    WHERE sd.department_id =$1
                `,
                [department_id]
            )
            if (result.rowCount === 0) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: 'No staff found in the department'
                    })
                }
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: 'Department staff fetched successfully',
                    body: result.rows
                })
            }

        } catch (error) {
            console.error('Error while getting department staff', error);
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