const { MongoClient } = require('mongodb');
const http = require('http');
const fs = require('fs');
const readline = require('readline');

const uri = "mongodb+srv://stockexchangeuser1:w7o8lxhnXVoBHBAx@cluster0.qtbascu.mongodb.net/?retryWrites=true&w=majority";

async function insertCompanyData(data) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db("stockSymbols");
    const collection = database.collection("companies");
    await collection.insertMany(data);
  } catch (err) {
    console.log("Error inserting data into MongoDB:", err);
    throw err;
  } finally {
    await client.close();
  }
}

async function readCSVFile(filename) {
  const data = [];
  const fileStream = fs.createReadStream(filename);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const [companyName, stockTicker, stockPrice] = line.split(',');
    data.push({ companyName, stockTicker, stockPrice: parseFloat(stockPrice) });
  }

  return data;
}

const port = process.env.PORT || 3000;

http.createServer(async function (req, res) {
  if (req.url === '/') {
    try {
      const csvData = await readCSVFile('companies.csv');
      await insertCompanyData(csvData);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write("<h2>Data Inserted</h2>");
      res.write("Success! Data from CSV file inserted into database.");
      res.end();
    } catch (err) {
      console.log("Error in request:", err);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.write("An error occurred while processing the request.");
      res.end();
    }
  }
}).listen(port, () => {
  console.log(`Server running on port ${port}`);
});
