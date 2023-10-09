const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const app = express();
const port = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "unauthorized access" });
    }
    const token = authorization.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
    });
};

// mongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `${process.env.Mongo_URI}`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
// tz5W1lH05hBSMVmN;
async function run() {
    try {
        const usersCollection = client.db("moon-task1").collection("users");
        const jewelryCollection = client.db("moon-task1").collection("jewelries");
        const addedJewelryCollection = client.db("moon-task1").collection("addedJewelry");

        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "7d",
            });

            res.send({ token });
        });

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user?.role !== "admin") {
                return res.status(403).send({ error: true, message: "forbidden access!" });
            }
            next();
        };

        // users
        app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
            let query = {};

            if (req.query?.email) {
                query.email = { $regex: req.query.email, $options: "i" };
            }

            if (req.query?.name) {
                query.name = { $regex: req.query.name, $options: "i" };
            }

            if (req.query?.role) {
                query.role = { $regex: req.query.role, $options: "i" };
            }

            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });

        app.get("/users/:role/:email", verifyJWT, async (req, res) => {
            const role = req.params.role;
            const email = req.params.email;

            if (email !== req.decoded.email) {
                return res.send({ [role]: false });
            }

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { [role]: user?.role === role };
            res.send(result);
        });

        app.patch("/users/:email", verifyJWT, verifyAdmin, async (req, res) => {
            const { email } = req.params;
            const { role } = req.body;

            try {
                await usersCollection.updateOne({ email: email }, { $set: { role: role } });

                res.status(200).send({ message: "User role updated successfully" });
            } catch (error) {
                console.error("Error updating user role:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: "user already exists" });
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.delete("/users/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        app.get("/jewelries", async (req, res) => {
            const cursor = jewelryCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get("/jewelries/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jewelryCollection.findOne(query);
            res.send(result);
        });

        app.post("/jewelries", async (req, res) => {
            const jewelries = req.body;
            const result = await jewelryCollection.insertOne(jewelries);
            res.send(result);
        });

        app.get("/addedJewelry", async (req, res) => {
            let query = {};

            if (req.query?.email) {
                query = { email: req.query.email };
            }

            if (req.query.search) {
                query.name = { $regex: req.query.search, $options: "i" };
            }

            // if (req.params.category) {
            //     if (
            //         req.params.category == "Scale Figures" ||
            //         req.params.category == "Bishoujo Figures" ||
            //         req.params.category == "Figma" ||
            //         req.params.category == "Nendoroid"
            //     ) {
            //         query.category = req.params.category;
            //     } else {
            //         query.category = { $regex: req.params.category, $options: "i" };
            //     }
            // }

            const result = await addedJewelryCollection.find(query).toArray();

            res.send(result);
        });

        app.get("/addedJewelry/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await addedJewelryCollection.findOne(query);
            res.send(result);
        });

        app.post("/addedJewelry", async (req, res) => {
            const figure = req.body;
            const result = await addedJewelryCollection.insertOne(figure);
            res.send(result);
        });

        app.put("/addedJewelry/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };

            const updatedJewel = req.body;
            const jewelries = {
                $set: {
                    img: updatedJewel.img,
                    email: updatedJewel.email,
                    name: updatedJewel.name,
                    price: updatedJewel.price,
                    quantity: updatedJewel.quantity,
                    seller: updatedJewel.seller,
                    description: updatedJewel.description,
                    Manufacturer: updatedJewel.Manufacturer,
                    category: updatedJewel.category,
                    rating: updatedJewel.rating,
                },
            };
            const result = await addedJewelryCollection.updateOne(filter, jewelries, options);
            res.send(result);
        });

        app.delete("/addedJewelry/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await addedJewelryCollection.deleteOne(query);
            res.send(result);
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You are successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("moon-task1 server is running");
});

app.listen(port, () => {
    console.log(`moon-task1 server is running at ${port}`);
});
