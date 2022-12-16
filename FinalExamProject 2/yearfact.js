const http = require('http');
const path = require('path')
require("dotenv").config({ path: path.resolve(__dirname, 'secrets/.env') }) 
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const { argv } = require('process');

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const dbName = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION 
const databaseAndCollection = {db: dbName, collection: collection};
const { MongoClient, ServerApiVersion, ListCollectionsCursor } = require('mongodb');
const { response } = require('express');
const { lookup } = require('dns');
const { parse } = require('dotenv');
const uri = `mongodb+srv://${userName}:${password}@cluster0.1vdqfv6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const fetch = require('node-fetch');

const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'a77d95945amsh377ab92a11e6ce5p1bf7afjsnef0ef2943a08',
      'X-RapidAPI-Host': 'numbersapi.p.rapidapi.com'
    }
  };


process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    console.log(`Not enough resources`);
    process.exit(1);
}

const portNumber = Number(process.argv[2]);


app.use(bodyParser.urlencoded({extended:false}));

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});
app.get("/fact", (request, response) => {
    const variables = {
        address: `http://localhost:${portNumber}/processYear`
    }

    response.render("getFact", variables);
    
});

app.post("/processYear", async(request, response) =>{
    let {year} = request.body;

    const url = `https://numbersapi.p.rapidapi.com/${year}/year?fragment=true&json=true`;
    let obj;
    fetch(url, options)
        .then(res => res.json())
        .then(json => processObject(json))
        .catch(err => console.error('error:' + err));

        function processObject(json){
            obj = json;
        }



    try{
        await client.connect();
        let form = { year: Number(year), fact: obj.text}
        await insertFact(client, databaseAndCollection, form);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }

    const variables = {
        year: year,
        fact: obj.text
    }

    response.render("retrievedFact",variables);


   
});

app.get("/history", (request, response) =>{
    const variables = {
        address: `http://localhost:${portNumber}/processHistory`
    }

    response.render("history", variables);

});

app.post("/processHistory", async(request, response) =>{
    let {year} = request.body;

    if (year == "All") {
        try {
            await client.connect();
            let filter = {};
            const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
            
            const result = await cursor.toArray();
            
           let table = "";

           result.forEach((e) =>{
                table += `<tr><td>${e.year}</td><td>${e.fact}</td></tr>`;
           });


            const variables = {
                table: table
            }
            response.render("displayHistory", variables);
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    } else {
        try{
            await client.connect();
            let filter = {year: Number(year)};
            const cursor = client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
            
            const result = await cursor.toArray();
            
           let table = "";

           result.forEach((e) =>{
                table += `<tr><td>${e.year}</td><td>${e.fact}</td></tr>`;
           });


            const variables = {
                table: table
            }
            response.render("displayHistory", variables);
        }catch (e){
            console.log(e)
        } finally {
            await client.close();
        }
    }







});






app.listen(portNumber);











   

    


    console.log(`Web server started and running at http://localhost:${portNumber}`);
    const prompt = "Stop to shutdown the server: ";
    process.stdout.write(prompt);
    
    process.stdin.on("readable", () => {
        let data = process.stdin.read();
        if (data !== null){
            let command = data.trim();
    
            if (command === "stop"){
                console.log("Shutting down the server");
                process.exit(0);
            } else {
                console.log(`Invalid command: ${command}`);
            }
            process.stdout.write(prompt);
            process.stdin.resume();
    
        }
    });


    async function insertFact(client, databaseAndCollection, form){
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(form);
    }


    
