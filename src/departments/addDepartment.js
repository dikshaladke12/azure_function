const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')
const { createDepartment } = require('../tables/department');

app.http("addDepartment", {
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
            const { dept_name, description, image, created_by } = body;
            if (!dept_name || !description || !created_by) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        message: "All fields are required"
                    })
                }
            }
            await connectDb(client);
            await createDepartment();

            const checkUserQuery = 'SELECT * FROM userTable WHERE id = $1';
            const userResult = await client.query(checkUserQuery, [created_by]);

            if (userResult.rowCount === 0) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({ error: "User with this ID does not exist." })
                };
            }
            const user = userResult.rows[0];
            if (!user.is_superuser) {
                return context.res = {
                    status: 403,
                    body: JSON.stringify({ error: "You must be an admin to add a department." })
                };
            }

            const query = 'INSERT INTO department (dept_name, description, image, created_by) VALUES ($1, $2, $3, $4) RETURNING *';
            const values = [dept_name, description, image || null, created_by]
            const result = await client.query(query, values)
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "Department added successfully",
                    body: result.rows[0]
                })
            }

        } catch (error) {
            console.error('Error adding department:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    message: "Error adding department",
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