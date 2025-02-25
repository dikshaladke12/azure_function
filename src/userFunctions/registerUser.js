const { app } = require('@azure/functions');
const { connectDb, connect_client, closeDb } = require('../utils/db')
const bcrypt = require('bcrypt')
const {createTableforUser} = require('../utils/userTable')

app.http('registerUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    headers: {
        'Content-Type': 'application/json'
    },
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            const { first_name, last_name, email, country_code, phone, password } = body;
            if (!first_name || !last_name || !country_code || !phone || !email || !password) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All the fields are required"
                    })
                }
            }

            const countryCodeRegex = /^\+[1-9][0-9]{0,2}$/;
            if (!countryCodeRegex.test(country_code)) {
                return (context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "Invalid country code format. Example: +1, +44, +91",
                    }),
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await connectDb(client);
            await createTableforUser();

            const query = 'INSERT INTO userTable (first_name, last_name, email, country_code, phone, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
            const values = [first_name, last_name, email, country_code, phone, hashedPassword]
            const result = await client.query(query, values);

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "user created",
                    body: result.rows[0]
                })
            }
        } catch (error) {
            console.log(`error`, error);
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
                await closeDb(client);
            }

        }
    }
});