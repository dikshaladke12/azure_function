const { connect_client, connectDb, closeDb } = require('./db')

const oneTimeLink = async () => {
    const client = connect_client();
    try {
        await connectDb(client);
        console.log("ggggggggggggggggggg")
        const query = `
            CREATE TABLE IF NOT EXISTS onetimelink (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                invited_by INT ,
                code_type VARCHAR(50) CHECK (code_type IN ('invite', 'forgot-password')),
                token VARCHAR(255) NOT NULL,
                expires_at VARCHAR(255) NOT NULL,
                is_expired BOOLEAN DEFAULT FALSE,
        
                FOREIGN KEY (invited_by) REFERENCES usertable(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES usertable(id) ON DELETE SET NULL 
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

module.exports = { oneTimeLink }