const { app } = require('@azure/functions');
const { connectDb, connect_client, closeDb } = require('../utils/db')

app.http('getAllDepartment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client()

        try {
            await connectDb(client);
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get("page")) || 1; 
            const search = url.searchParams.get("search") || ""; 
            const limit = 5; 
            const offset = (page - 1) * limit; 

            console.log(`Fetching page: ${page}, search: ${search}`);

            const query = `
                    SELECT * FROM department
                    WHERE is_deleted = FALSE AND dept_name ILIKE $1
                    ORDER BY id ASC
                    LIMIT $2 OFFSET $3
                `;
            const values = [`%${search}%`, limit, offset];
            const result = await client.query(query, values);

            const countQuery = `
                    SELECT COUNT(*) FROM department 
                    WHERE is_deleted = FALSE AND dept_name ILIKE $1
                `;
            const countResult = await client.query(countQuery, [`%${search}%`]);
            const totalRecords = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(totalRecords / limit);

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    data: result.rows,
                    pagination: {
                        currentPage: page,
                        totalPages: totalPages,
                        totalRecords: totalRecords,
                        perPage: limit
                    }
                })
            };
        }
        catch (error) {
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
        }
        finally {
            if (client) {
                await closeDb(client)
            }
        }
    }
})





