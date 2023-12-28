const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();

// Connect to MongoDB
const uri =
  "mongodb+srv://admin:admin@cluster0.gxdptge.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let rodeoDriveCollection; // Collection reference

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    // Get reference to the "rodeo" collection
    rodeoDriveCollection = client.db("streetitup").collection("Rodeo Drive");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the application on connection error
  });

// Set the view engine to EJS
app.set("view engine", "ejs");

// Render the table in EJS
app.get("/", async (req, res) => {
  try {
    // Fetch RodeoDrive data from MongoDB
    const rodeoDriveData = await rodeoDriveCollection.find().toArray();

    if (!rodeoDriveData || rodeoDriveData.length === 0) {
      // Log an error and send a response if no data is found
      console.error('No data found in the "rodeo" collection.');
      return res.status(404).send("No data found");
    }

    // Log the fetched data for debugging
    console.log("Fetched data from MongoDB:", rodeoDriveData);

    // Render the EJS template with the data
    res.render("index", { rodeoDriveData });
  } catch (error) {
    // Log any errors that occur during the data fetch
    console.error("Error fetching data from MongoDB:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/api/delete-product/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;

    // Validate that productId is a valid ObjectId
    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Product ID" });
    }

    // Convert productId to ObjectId
    const objectId = new ObjectId(productId);

    // Find the product in MongoDB and delete it
    const result = await rodeoDriveCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 1) {
      return res.json({
        success: true,
        message: "Product deleted successfully",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product from MongoDB:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5031;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Close the MongoDB connection when the app is terminated
process.on("SIGINT", () => {
  client.close().then(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

module.exports = app;
