const {app } = require('@azure/functions')
const {connect_client, closeDb, connectDb }= require("../utils/db")

app.http("deleteUser",{
    methods:['DELETE'],
    authLevel:'anonymous',
    handler: async function (context, req){

    }
})