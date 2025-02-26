const { app } = require('@azure/functions');
const { connectDb, closeDb, connect_client } = require('../tables/db')

const bcrypt = require('bcrypt')
const formidable = require('formidable')
const path = require('path')
const fs = require('fs')


app.http('createUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    headers: {
        'Content-Type': 'application/json'
    },
    handler: async function (req, context) {
        const client = connect_client();
        try {
            const bodyText = await req.text();

            // Parse JSON
            const body = JSON.parse(bodyText);
            const { name, email, age, password } = body;
            if (!name || !email || !age ||!password) {
                return context.res = {
                    status: 400,
                    success: false,
                    body: JSON.stringify({
                        error: "All the fields are required"
                    })
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await connectDb(client);
            await createUserTable();

            const query = 'INSERT INTO users (name, email, age, password) VALUES ($1, $2, $3, $4) RETURNING *';
            const values = [name, email, age,hashedPassword]
            const result = await client.query(query, values);

            return context.res = {
                status: 200,
                success: true,
                body: JSON.stringify({
                    message: "user created",
                    body: result.rows[0]
                })
            }
        } catch (error) {
            console.log(`error`, error);
            return context.res = {
                status: 500,
                success: false,
                body: JSON.stringify({
                    error: error.message
                })
            }
        }
        finally {
            if (client) {
                await closeDb(client);
            }

        }
    }
});


// app.http("createUser", {
//     methods: ['POST'],
//     authLevel: 'anonymous',
//     headers: {
//         'Content-Type': 'multipart/form-data'
//     },
//     handler: async function (req, context) {
//         const client = connect_client();
//         try {
//             const form = new formidable.IncomingForm();

//             form.uploadDir = path.join(__dirname, 'uploads'); // local folder for testing
//             form.keepExtensions = true;

//             form.parse(req, async (err, fields, files) => {
//                 if (err) {
//                     return context.res = {
//                         status: 500,
//                         success: false,
//                         body: JSON.stringify({ error: err.message })
//                     }
//                 }

//                 const { name, email, age, password } = fields;
//                 if (!name || !email || !age || !password) {
//                     return context.res = {
//                         status: 400,
//                         success: false,
//                         body: JSON.stringify({
//                             error: "All the fields are required"
//                         })
//                     }
//                 }

//                 const uploadImage = files.image_url;
//                 let imageUrl = null;
//                 if (uploadImage) {
//                     const imagePath = path.join(__dirname, 'uploads', uploadImage.originalFilename);
//                     fs.renameSync(uploadImage.filepath, imagePath);
//                     imageUrl = `/uploads/${uploadImage.originalFilename}`;
//                 }
//                 await connectDb(client)

//                 const query = 'INSERT INTO users (name, email, age, password, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *';
//                 const values = [name, email, age, password, imageUrl];
//                 const result = await client.query(query, values);
//                 return context.res = {
//                     status: 200,
//                     success: true,
//                     body: JSON.stringify({
//                         message: "user created",
//                         body: result.rows[0]
//                     })

//                 }

//             })
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
// });


