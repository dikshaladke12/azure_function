const { connect_client, connectDb, closeDb } = require('./db')

const template_tags = async () => {
    const client = connect_client();
    try {
        await connectDb(client);
        const query = `
            CREATE TABLE IF NOT EXISTS template_tags
            (
                id SERIAL PRIMARY KEY,
                tag_name VARCHAR(255) NOT NULL UNIQUE,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_deleted boolean DEFAULT false,
                updated_at TIMESTAMP
            )`
        await client.query(query);
        console.log("Template tags table created successfully");

    }
    catch (error) {
        console.error('Error fetching template tags:', error);
        return null;
    }
    finally {
        await closeDb(client);
    }
}

module.exports = { template_tags }