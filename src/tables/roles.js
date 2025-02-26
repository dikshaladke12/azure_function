const { connect_client, connectDb, closeDb } = require('./db')

const roles = async () => {
    const client = connect_client();
    try {
        await connectDb(client);
        const query = `
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                role_name VARCHAR(255),
                description VARCHAR(255),
        ) `

        console.log("Table Created");
        await client.query(query)

    } catch (error) {
        console.error('Error fetching user from reset token:', error);
        return null;
    } finally {
        await closeDb(client);
    }
}

module.exports = { roles }