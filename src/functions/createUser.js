const { app } = require('@azure/functions');
const { connectDb, createUserTable, connect_client, closeDb } = require('../utils/db')

app.http('createUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    headers: {
        'Content-Type': 'application/json'
    },
    handler: async function (req, context) {
        console.log("Context:", context);
        const client = connect_client();
        try {
            const bodyText = await req.text();
          
            // Parse JSON
            const body = JSON.parse(bodyText);
            const { name, email, age } = body;
            if (!name || !email || !age) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All the fields are required"
                    })
                }
            }

            await connectDb(client);
            await createUserTable();

            const query = 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *';
            const values = [name, email, age]
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
