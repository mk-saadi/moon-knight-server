const express = require("express");
const cors = require("cors");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// mongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mrt0xqs.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        const figureCollection = client.db("animeFig").collection("figures");
        const addedFigureCollection = client.db("animeFig").collection("addedFigure");

        app.get("/figures", async (req, res) => {
            const cursor = figureCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/figures/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await figureCollection.findOne(query);
            res.send(result);
        });

        app.post("/figures", async (req, res) => {
            const figures = req.body;
            const result = await figureCollection.insertOne(figures);
            res.send(result);
        });

        app.get("/addedFigure", async (req, res) => {
            let query = {};

            if (req.query?.email) {
                query = { email: req.query.email };
            }

            if (req.query.search) {
                query.name = { $regex: req.query.search, $options: "i" };
            }

            if (req.params.category) {
                if (
                    req.params.category == "Scale Figures" ||
                    req.params.category == "Bishoujo Figures" ||
                    req.params.category == "Figma" ||
                    req.params.category == "Nendoroid"
                ) {
                    query.category = req.params.category;
                } else {
                    query.category = { $regex: req.params.category, $options: "i" };
                }
            }

            const limit = parseInt(req.query.limit) || 20;

            const result = await addedFigureCollection
                .find(query)
                .sort({ price: -1 })
                .limit(limit)
                .toArray();

            res.send(result);
        });

        app.get("/addedFigure/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await addedFigureCollection.findOne(query);
            res.send(result);
        });

        app.post("/addedFigure", async (req, res) => {
            const figure = req.body;
            const result = await addedFigureCollection.insertOne(figure);
            res.send(result);
        });

        app.put("/addedFigure/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };

            const updatedFigs = req.body;
            const figures = {
                $set: {
                    img: updatedFigs.img,
                    email: updatedFigs.email,
                    name: updatedFigs.name,
                    price: updatedFigs.price,
                    quantity: updatedFigs.quantity,
                    seller: updatedFigs.seller,
                    description: updatedFigs.description,
                    Manufacturer: updatedFigs.Manufacturer,
                    category: updatedFigs.category,
                    rating: updatedFigs.rating,
                },
            };
            const result = await addedFigureCollection.updateOne(filter, figures, options);
            res.send(result);
        });

        app.delete("/addedFigure/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await addedFigureCollection.deleteOne(query);
            res.send(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("animeFig server is running");
});

app.listen(port, () => {
    console.log(`animeFig server is running at ${port}`);
});
