const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')


app.http('getUsers',{
    method: ['GET'],
    authLevel: 'anonymous',
    handler: async function (context) {
        const client = connect_client()

        try{
            await connectDb(client);
            const result = await client.query(`SELECT * FROM users`);
            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify(result.rows)
            }
        }
        catch(error){
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
        }
        finally{
            if(client){
                await closeDb(client)
            }
        }
    }
})