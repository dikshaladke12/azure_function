// const { app } = require('@azure/functions');
// const { connectDb, connect_client, closeDb } = require('../utils/db')
// const bcrypt = require('bcrypt')
// const {createTableforUser} = require('../utils/userTable')

// app.http('registerUser', {
//     methods: ['POST'],
//     authLevel: 'anonymous',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     handler: async function (req, context) {
//         const client = connect_client();
//         try {
//             const bodyText = await req.text();
//             const body = JSON.parse(bodyText);
//             const { first_name, last_name, email, country_code, phone, password } = body;
//             if (!first_name || !last_name || !country_code || !phone || !email || !password) {
//                 return context.res = {
//                     status: 400,
//                     success: false,
//                     body: JSON.stringify({
//                         error: "All the fields are required"
//                     })
//                 }
//             }

//             const countryCodeRegex = /^\+[1-9][0-9]{0,2}$/;
//             if (!countryCodeRegex.test(country_code)) {
//                 return (context.res = {
//                     status: 400,
//                     success: false,
//                     body: JSON.stringify({
//                         error: "Invalid country code format. Example: +1, +44, +91",
//                     }),
//                 });
//             }

//             const hashedPassword = await bcrypt.hash(password, 10);
//             await connectDb(client);
//             await createTableforUser();

//             const query = 'INSERT INTO userTable (first_name, last_name, email, country_code, phone, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
//             const values = [first_name, last_name, email, country_code, phone, hashedPassword]
//             const result = await client.query(query, values);

//             return context.res = {
//                 status: 200,
//                 success: true,
//                 body: JSON.stringify({
//                     message: "user created",
//                     body: result.rows[0]
//                 })
//             }
//         } catch (error) {
//             console.log(`error`, error);
//             return context.res = {
//                 status: 500,
//                 success: false,
//                 body: JSON.stringify({
//                     error: error.message
//                 })
//             }
//         }
//         finally {
//             if (client) {
//                 await closeDb(client);
//             }

//         }
//     }
// });


const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')
const bcrypt = require('bcrypt');
const { createTableforUser } = require('../tables/userTable');

app.http('registerUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    headers: {
        'Content-Type': 'application/json'
    },
    handler: async function (req, context) {
        console.log(req,"req");
        
        const client = connect_client();
        try {
            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            const { first_name, last_name, email, country_code, phone, password, is_staff, is_manager, role_id } = body;

            if (!first_name || !last_name || !country_code || !phone || !email || !password || !role_id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All fields are required"
                    })
                };
            }

            await connectDb(client);
            await createTableforUser();

            const countryCodeRegex = /^\+[1-9][0-9]{0,2}$/;
            if (!countryCodeRegex.test(country_code)) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "Invalid country code format. Example: +1, +44, +91",
                    }),
                };
            }


            const roleQuery = `SELECT * FROM roles WHERE id = $1`;
            const roleResult = await client.query(roleQuery, [role_id]);
            if (roleResult.rowCount === 0) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "Invalid role ID"
                    })
                };
            }


            const hashedPassword = await bcrypt.hash(password, 10);
            

            // Check if this is the first user
            const countQuery = `SELECT COUNT(*) FROM userTable`;
            const countResult = await client.query(countQuery);
            const userCount = parseInt(countResult.rows[0].count);

            let is_superuser = userCount === 0; // First user will be a superuser

            // If trying to register staff/manager, check if the requester is a superuser
            if ((is_staff || is_manager) && !is_superuser) {
                return context.res = {
                    status: 403,
                    success: false,
                    body: JSON.stringify({
                        error: "Only a superuser can create staff or manager accounts."
                    })
                };
            }

            const query = `
                INSERT INTO userTable (first_name, last_name, email, country_code, phone, password, is_superuser, is_staff, is_manager, role_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`;
            const values = [first_name, last_name, email, country_code, phone, hashedPassword, is_superuser, is_staff || false, is_manager || false, role_id];

            const result = await client.query(query, values);

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "User created",
                    body: result.rows[0]
                })
            };

        } catch (error) {
            console.error(`Error:`, error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            };
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
});
