const { app } = require('@azure/functions')
const { connect_client, connectDb, closeDb } = require('../utils/db');


app.http('getUserByID', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) { 
        const client = connect_client();
        try {
            const id =  req.params.id
            // const id = req.query.get('id');
            console.log("id", id);

            // const url = new URL(req.url,`http://${req.headers.host}`);
            // console.log("url", url);
            // const id = url.searchParams.get("id");
            
            if (!id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "User ID is required"
                    })
                }
            }
            console.log("ggggggggggggggggggggg");
            

            // const numericId = parseInt(id, 10);  

            const query = `SELECT * FROM userTable WHERE id=$1`;
            const values = [id]
            const result = await client.query(query, values);

            console.log("ppppppppppppppppp")

            if (result.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({
                        error: "User not found"
                    })
                }
            }

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    user: result.rows[0]
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

        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})