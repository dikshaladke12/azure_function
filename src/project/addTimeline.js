const { app } = require('@azure/functions');
const { connect_client, connectDb, closeDb } = require('../tables/db');

app.http("addTimeline", {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            await connectDb(client);
            const bodyText = await req.text();
            const body = JSON.parse(bodyText);
            const { timeline_type } = body;

            if (!timeline_type) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ message: "Timeline type is required" })
                }
            }

            const result = await client.query(
                `INSERT INTO project_timeline (timeline_type) VALUES ($1) RETURNING id`,
                [timeline_type]
            );

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "Timeline added successfully",
                    timeline_id: result.rows[0].id
                })
            }

        } catch (error) {
            console.error('Error adding timeline:', error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({ error: 'An error occurred while adding timeline' })
            }
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
});
