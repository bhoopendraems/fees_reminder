
const { Client } = require('pg');

var connection = new Client({
    host: "localhost",
    user:"postgres",
    password:"root",
    database: "fees_reminder",
    charset: 'utf8mb4'
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("database Connected successfully!");
})

module.exports = connection;