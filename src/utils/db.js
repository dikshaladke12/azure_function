const { Client } = require('pg')


const connectDb = async (client) => {
    await client.connect();
};

const closeDb = async (client) => {
    await client.end();
};


const connect_client = () => {

    console.log("connect to database")
    return new Client({
        user: 'postgres',
        host: '127.0.0.1',
        database: 'user_database1',
        password: 'postgres',
        port: 5432,
    })

}

const createUserTable = async () => {
    const client = connect_client();  
    try {
        await connectDb(client);
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                age INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`;
            console.log("table created")
        await connect_client.query(query);
    } catch (error) {
        console.error('Error creating user table:', error);
    } finally {
        await closeDb(client);
    }
};

module.exports = { connectDb, createUserTable, connect_client, closeDb };

