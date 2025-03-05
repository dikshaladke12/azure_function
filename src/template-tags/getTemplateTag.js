const { app } = require('@azure/functions');
const { connect_client, connectDb, closeDb } = require("../tables/db");

app.http('get_templateTag', {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async function (req, context) {
        console.log(req)
        const client = connect_client();
        try {
            const url = new URL(req.url);
            const tag_id = url.searchParams.get("tag_id");
            if (!tag_id) {
                return context.res = {
                    status: 400,
                    body: JSON.stringify({
                        error: "Template ID is required"
                    })
                }
            }
            await connectDb(client);
            const result = await client.query(
                `
                    SELECT * FROM template_tags WHERE id=$1 AND is_deleted=false
                `, [tag_id]
            )
            if (result.rows.length === 0) {
                return context.res = {
                    status: 404,
                    body: JSON.stringify({
                        error: "Template tag not found"
                    })
                };
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    data: result.rows[0] || {}
                })
            }

        } catch (error) {
            console.log(`error`, error)
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