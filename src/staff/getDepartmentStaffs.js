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
            const page = parseInt(url.searchParams.get("page")) || 1;
            const search = url.searchParams.get("search") || "";
            const limit = 2;
            const offset = (page - 1) * limit;

            const sort_by = url.searchParams.get(`sort_by`) || 'u.role_name'
            const order = url.searchParams.get('order') || 'ASC'


            if (!department_id) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({
                        error: 'Department ID is required'
                    })
                }
            }

            const validOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC"

            const result = await client.query(
                `
                    SELECT u.id, u.first_name, u.last_name, u.email, u.country_code, u.phone, u.invitation_status, r.role_name, d.dept_name, d.description
                    FROM staff_departments as sd
                    JOIN userTable as u ON sd.staff_id = u.id
                    JOIN department as d ON sd.department_id = d.id
                    JOIN roles as r ON u.role_id = r.id
                    WHERE sd.department_id =$1
                        AND (u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR u.email ILIKE $2)
                    ORDER BY ${sort_by} ${validOrder}
                    LIMIT $3 OFFSET $4
                    
                `,
                [department_id, `%${search}%`, limit, offset]
            )
            const countQuery = `
                SELECT COUNT(*) FROM userTable 
                WHERE is_staff = true 
                AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
            `;
            const countResult = await client.query(countQuery, [`%${search}%`]);
            const totalRecords = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalRecords / limit);
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
                    body: result.rows,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalRecords: totalRecords,
                        perPage: limit
                    }
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