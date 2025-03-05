const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db');
const { template_tags } = require('../tables/template-tags')

app.http("add-tags", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {

            await connectDb(client);
            await template_tags();

            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            const { tag_name, description } = body
            if (!tag_name || !description) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        message: "All fields are required"
                    })
                }
            }

            const query = `
                INSERT INTO template_tags (tag_name, description)
                VALUES ($1, $2) 
                RETURNING *
            `;
            const values = [tag_name, description]
            const result = await client.query(query, values);
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "Tags added successfully",
                    body: result.rows[0]
                })
            }

        } catch (error) {
            console.error("error:", error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    message: "Error adding tags",
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