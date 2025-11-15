//Definition & imports
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

// Middlewares
require("dotenv").config();
app.use(cors());
app.use(express.json());

app.use(async (req, res, next) => {
  console.log(
    `⚡ ${req.method} - ${req.path} from ${
      req.host
    } at ⌛ ${new Date().toLocaleString()}`
  );
  next();
});

//ports & clients
const port = process.env.PORT || 5000;
const uri = process.env.URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//listeners
client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Hero Apps Server listening ${port}`);
      console.log(`Hero Apps Server Connected with DB`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

//DB & collections
const database = client.db("heroAppsDB");
const appsCollection = database.collection("apps");

//Apps Route

app.get("/apps", async (req, res) => {
  const { limit=10, skip=0, sort = "rating", order="desc", search="" } = req.query;
  let searchQuery = {};
  if(search){
    searchQuery.title = { $regex: search, $options: "i" };
  }
  const sortOptions = {};
  if(sort){
    sortOptions[sort || 'size'] = order === "asc" ? 1 : -1;
  }
  try {
    const apps = await appsCollection
      .find(searchQuery)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(Number(skip))
      .project({id:1,title:1, image:1, rating:1, size:1, downloads:1, description:1})
      .toArray();
    const totalApps = await appsCollection.countDocuments(searchQuery);
    res.send({apps, totalApps});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/apps/:id", async (req, res) => {
  try {
    const appId = req.params.id;

    if (appId.length != 24) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const query = new ObjectId(appId);
    const app = await appsCollection.findOne({ _id: query });
    res.json(app);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Basic routes
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Hero Apps Server" });
});
//404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: "API not found",
  });
});
