const { app } = require('@azure/functions')
const { connectDb, closeDb, connect_client } = require('../tables/db')


// app.http('getUserByID', {
//     methods: ['GET'],
//     authLevel: 'anonymous',
//     handler: async function (req, context) {
//         console.log("req", req)
//         const client = connect_client();
//         try {

//             // const url = new URL(req.url);
//             // const id = url.searchParams.get("id");

//             const id = req.params.id

//             if (!id) {
//                 return context.res = {
//                     status: 400,
//                     success: false,
//                     body: JSON.stringify({
//                         error: "User ID is required"
//                     })
//                 }
//             }
//             console.log("ggggggggggggggggggggg");

//             const result = await client.query(`SELECT * FROM userTable WHERE id=$1`, [id]);

//             console.log("ppppppppppppppppp",result)

//             if (result.rowCount === 0) {
//                 return context.res = {
//                     status: 404,
//                     success: false,
//                     body: JSON.stringify({
//                         error: "User not found"
//                     })
//                 }
//             }

//             return context.res = {
//                 status: 200,
//                 success: true,
//                 body: JSON.stringify({
//                     user: result.rows[0]
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

//         } finally {
//             if (client) {
//                 await closeDb(client);
//             }
//         }
//     }
// })

app.http('getUserById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const url = new URL(req.url);
            const user_id = url.searchParams.get("user_id");
            if (!user_id) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "User ID is required"
                    })
                }
            }
            await connectDb(client);

            const result = await client.query(
                `
                    SELECT * 
                    FROM userTable 
                    WHERE id=$1
                `,
                [user_id]
            );
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
            console.log(`error`, error)
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
        } finally {
            if (client) {
                await closeDb(client)
            }
        }
    }
})