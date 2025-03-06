const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')

app.http('viewManager', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client(req, context);
        try {
            await connectDb(client);
            const url = new URL(req.url);
            const manager_id = url.searchParams.get('manager_id');
            if (!manager_id) {
                context.res = {
                    status: 400,
                    body: JSON.stringify({
                        error: 'manager ID is required'
                    })
                }
                return;
            }
            const result = await client.query(
                `
                    SELECT u.id, u.first_name, u.last_name, u.email, u.country_code, u.phone, r.role_name, u.last_login, u.date_joined, u.invitation_status, u.is_manager
                    FROM userTable AS u
                    JOIN roles AS r
                    ON u.role_id = r.id
                    WHERE u.id = $1 AND u.is_manager = true
                `, [manager_id]
            )
            console.log('result', result.rows)
            if (result.rows.length === 0) {
                context.res = {
                    status: 404,
                    body: JSON.stringify({
                        error: 'manager not found'
                    })
                };
                return
            }

            return context.res = {
                status: 200,
                body: JSON.stringify(result.rows[0])
            };

        } catch (error) {
            console.error('Error while getting manager', error);
            context.res = {
                status: 500,
                body: JSON.stringify({
                    error: error.message
                })
            }
            return
        } finally {
            if (client) {
                await closeDb(client);
            }
        }
    }
})