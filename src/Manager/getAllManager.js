const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db');

app.http('getAllManager', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client(req, context);
        try {
            await connectDb(client);
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get("page")) || 1;
            const search = url.searchParams.get("search") || "";
            const limit = 5;
            const offset = (page - 1) * limit;

            const result = await client.query(
                `
                    SELECT u.id, u.first_name, u.last_name, u.email, u.country_code, u.phone, r.role_name, u.last_login, u.date_joined, u.invitation_status, u.is_manager
                    FROM userTable AS u
                    JOIN roles AS r
                    ON u.role_id = r.id
                    WHERE u.is_manager = true 
                    AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)
                    LIMIT $2 OFFSET $3
                `,
                [`%${search}%`, limit, offset]
            );

            const countQuery = `
                SELECT COUNT(*) FROM userTable 
                WHERE is_manager = true 
                AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
            `;
            const countResult = await client.query(countQuery, [`%${search}%`]);
            const totalRecords = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalRecords / limit);

            if (result.rows.length === 0) {
                context.res = {
                    status: 404,
                    body: JSON.stringify({
                        error: 'manager not found'
                    })
                };
                return;
            }

            context.res = {
                status: 200,
                body: JSON.stringify({
                    success: true,
                    data: result.rows,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalRecords: totalRecords,
                        perPage: limit
                    }
                })
            };
            return;

        } catch (error) {
            console.error('Error while getting manager list', error);
            context.res = {
                status: 500,
                body: JSON.stringify({
                    error: error.message
                })
            };
            return;
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
});
