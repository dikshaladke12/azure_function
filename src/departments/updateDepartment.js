const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')


app.http("updatedepartmentDetails", {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const bodyText = await req.text();
            const body = JSON.parse(bodyText)

            const { id, dept_name, description, image } = body;
            if (!id || !dept_name || !description) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({ error: "All the fields are required" })
                }
            }
            const deptID = parseInt(id);
            if (isNaN(deptID)) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify(
                        { error: "dept ID must be a valid number" }
                    )
                }
            }
            await connectDb(client);

            const checkQuery = `SELECT * FROM department WHERE id = $1 AND is_deleted = FALSE`;
            const checkResult = await client.query(checkQuery, [deptID]);

            if (checkResult.rowCount === 0) {
                return context.res = {
                    status: 404,
                    success: false,
                    body: JSON.stringify({ error: "Department not found or already deleted" })
                };
            }

            const query = `
                            UPDATE department
                            SET dept_name=$1, description=$2, image=$3, updated_at=NOW()
                            WHERE id=$4 
                            RETURNING *
                        `;
            const values = [dept_name, description, image || null, deptID];
            const result = await client.query(query, values);

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "department updated",
                    body: result.rows[0]
                })
            }

        } catch (error) {
            context.log("error", error);
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