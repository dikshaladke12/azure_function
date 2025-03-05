const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http("deleteTemplateTag", {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        console.log(req)
        const client = connect_client();
        try {
            await connectDb(client);
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
            const result = await client.query(
                `
                    UPDATE template_tags 
                    SET is_deleted=true 
                    WHERE id=$1 AND is_deleted = false 
                `, [tag_id]
            );
            if (result.rowCount === 0) {
                const checkResult = await client.query(
                    `SELECT is_deleted FROM template_tags WHERE id = $1`,
                    [tag_id]
                );

                if (checkResult.rows.length > 0 && checkResult.rows[0].is_deleted) {
                    return context.res = {
                        status: 200,
                        body: JSON.stringify({
                            message: "Template tag already deleted"
                        })
                    };
                } else {
                    return context.res = {
                        status: 404,
                        body: JSON.stringify({
                            error: "Template tag not found"
                        })
                    };
                }
            }
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({ message: "Template tag deleted" })
            }
        } catch (error) {
            console.error("error:", error);
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
})