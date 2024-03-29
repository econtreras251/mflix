const MongoClient = require("mongodb").MongoClient
const ObjectId = require("mongodb").ObjectId
const MongoError = require("mongodb").MongoError

// This leading semicolon (;) is to make this Immediately Invoked Function Expression (IIFE).
// To read more about this type of expression, refer to https://developer.mozilla.org/en-US/docs/Glossary/IIFE
;(async () => {
  try {
    // ensure you update your host information below!
    const host =
      "mongodb+srv://m220student:m220password@mflix-iidsy.mongodb.net/test?retryWrites=true&w=majority"
    const client = await MongoClient.connect(
      host,
      { useNewUrlParser: true },
    )
    const mflix = client.db("mflix")

    const predicate = { lastupdated: { $exists: 1, $type: "string" } }
    const projection = {}
    const cursor = await mflix
      .collection("movies")
      .find(predicate, projection)
      .toArray()

    const moviesToMigrate = cursor.map(({ _id, lastupdated }) => ({
      updateOne: {
        filter: { _id: ObjectId(_id) },
        update: {
          $set: { lastupdated: new Date(Date.parse(lastupdated)) },
        },
      },
    }))
    console.log(
      "\x1b[32m",
      `Found ${moviesToMigrate.length} documents to update`,
    )

    const { modifiedCount } = await mflix
      .collection("movies")
      .bulkWrite(moviesToMigrate, { ordered: true, w: 1 })

    console.log("\x1b[32m", `${modifiedCount} documents updated`)
    client.close()
    process.exit(0)
  } catch (e) {
    if (
      e instanceof MongoError &&
      e.message.slice(0, "Invalid Operation".length) === "Invalid Operation"
    ) {
      console.log("\x1b[32m", "No documents to update")
    } else {
      console.error("\x1b[31m", `Error during migration, ${e}`)
    }
    process.exit(1)
  }
})()
