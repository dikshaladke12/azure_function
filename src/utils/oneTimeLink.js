const { connect_client, connectDb, closeDb } = require('../utils/db')

const oneTimeLink = async () => {
    const client = connect_client();
    try {
        await connectDb(client);
        const query = `
            CREATE TABLE IF NOT EXISTS reset_password_tokens (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                invited_by INT NOT NULL,
                code INT NOT NULL,
                code_type INT NOT NULL,
                expire_token VARCHAR(255) NOT NULL,
                expires_at VARCHAR(255) NOT NULL,
                is_expired BOOLEAN DEFAULT FALSE,
        
                FOREIGN KEY (invited_by) REFERENCES usertable(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES usertable(id) ON DELETE SET NULL 
        ) `

        const user = result.rows[0];
        await client.query('DELETE FROM reset_password_tokens WHERE token = $1', [token])
        return user;
    } catch (error) {
        console.error('Error fetching user from reset token:', error);
        return null;
    } finally {
        await closeDb(client);
    }
}

module.exports ={oneTimeLink}