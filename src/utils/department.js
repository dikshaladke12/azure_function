const { connect_client, closeDb, connectDb } = require("./db")

const createDepartment = async()=>{
    const client = connect_client();
    try {
        await connectDb(client);
        // console.log("ggggggggggggggggggg")
        const query = `
            CREATE TABLE IF NOT EXISTS department (
            id SERIAL PRIMARY KEY,
            dept_name VARCHAR(255) NOT NULL,
            description VARCHAR(255) NOT NULL,
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            is_deleted BOOLEAN DEFAULT FALSE,     
            created_by INT NOT NULL,   
            FOREIGN KEY (created_by) REFERENCES usertable(id) ON DELETE SET NULL    
        );`

        console.log("Table Created");
        await client.query(query);
    } catch (error) {
        console.error('Error creating department table:', error);
        return;
    }
    finally {
        await closeDb(client);
    }
}

module.exports = { createDepartment}