const { app } = require('@azure/functions');
const { connectDb, connect_client, closeDb } = require('../utils/db')

app.http('getAllusers', {
    method: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client()

        try {
            await connectDb(client);
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get("page")) || 1; 
            const search = url.searchParams.get("search") || ""; 
            const limit = 1; 
            const offset = (page - 1) * limit; 

            console.log(`Fetching page: ${page}, search: ${search}`);

            const query = `
                    SELECT * FROM userTable
                    WHERE first_name ILIKE $1
                    ORDER BY id ASC
                    LIMIT $2 OFFSET $3
                `;
            const values = [`%${search}%`, limit, offset];
            const result = await client.query(query, values);

            const countQuery = `SELECT COUNT(*) FROM userTable WHERE first_name ILIKE $1`;
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






// const { app } = require('@azure/functions');
// const { connectDb, connect_client, closeDb } = require('../utils/db');

// app.http('getUsers', {
//     methods: ['GET'],
//     authLevel: 'anonymous',
//     handler: async function (req, context) {
//         const client = connect_client();

//         try {
//             await connectDb(client);

//             // ✅ Extract query parameters
//             const url = new URL(req.url);
//             const page = parseInt(url.searchParams.get("page")) || 1; // Default page = 1
//             const search = url.searchParams.get("search") || ""; // Default search = ""
//             const limit = 5; // ✅ Fetch 5 records per page
//             const offset = (page - 1) * limit; // ✅ Calculate offset

//             console.log(`Fetching page: ${page}, search: ${search}`);

//             // ✅ Query with Pagination & Search
//             const query = `
//                 SELECT * FROM users
//                 WHERE name ILIKE $1
//                 ORDER BY id ASC
//                 LIMIT $2 OFFSET $3
//             `;
//             const values = [`%${search}%`, limit, offset];

//             const result = await client.query(query, values);

//             // ✅ Get Total Count (for pagination metadata)
//             const countQuery = `SELECT COUNT(*) FROM users WHERE name ILIKE $1`;
//             const countResult = await client.query(countQuery, [`%${search}%`]);
//             const totalRecords = parseInt(countResult.rows[0].count);
//             const totalPages = Math.ceil(totalRecords / limit);

//             return context.res = {
//                 status: 200,
//                 success: true,
//                 body: JSON.stringify({
//                     data: result.rows,
//                     pagination: {
//                         currentPage: page,
//                         totalPages: totalPages,
//                         totalRecords: totalRecords,
//                         perPage: limit
//                     }
//                 })
//             };
//         } catch (error) {
//             return context.res = {
//                 status: 500,
//                 success: false,
//                 body: JSON.stringify({
//                     error: error.message
//                 })
//             };
//         } finally {
//             if (client) {
//                 await closeDb(client);
//             }
//         }
//     }
// });