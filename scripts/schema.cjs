const { Client, Databases, Permission, Role } = require("node-appwrite");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_COLLECTION_ID,
  APPWRITE_API_KEY,
} = process.env;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

const toNumberOrNull = (value) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

const comicsSchema = {
  title: {
    type: "string",
    required: true,
    size: 255,
  },
  description: {
    type: "string",
    required: false,
    size: 2048, // Allowing a longer text for description
  },
  status: {
    type: "string",
    required: true,
    size: 32,
    array: false,
  },
  rating: {
    type: "integer",
    required: false,
    min: 0,
    max: 5,
    default: 0,
  },
  coverImage: {
    type: "string",
    required: false,
    size: 2048,
  },
  createdAt: {
    type: "datetime",
    required: false,
  },
  updatedAt: {
    type: "datetime",
    required: false,
  },
};

const migrateSchema = async () => {
  try {
    // First check if collection exists, if not create it
    try {
      await databases.get(APPWRITE_DATABASE_ID);
      console.log("Database already exists");
    } catch (error) {
      if (error.code === 404) {
        await databases.create(APPWRITE_DATABASE_ID, "Comics Database");
        console.log("Database created successfully");
      } else {
        throw error;
      }
    }

    try {
      await databases.getCollection(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID
      );
      console.log("Collection already exists");
    } catch (error) {
      if (error.code === 404) {
        await databases.createCollection(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_ID,
          "Comics Collection"
        );
        console.log("Collection created successfully");
      } else {
        throw error;
      }
    }

    // Update collection permissions to allow read and write
    try {
      await databases.updateCollection(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        "Comics Collection",
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ],
        false
      );
      console.log("Collection permissions updated successfully");
    } catch (error) {
      console.error("Error updating collection permissions:", error);
      throw error;
    }

    // Create / update attributes
    for (const [name, definition] of Object.entries(comicsSchema)) {
      try {
        if (definition.type === "string") {
          await databases.createStringAttribute(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            name,
            definition.size,
            definition.required
          );
        } else if (definition.type === "integer") {
          await databases.createIntegerAttribute(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            name,
            definition.required,
            definition.min,
            definition.max,
            definition.default
          );
        } else if (definition.type === "datetime") {
          await databases.createDatetimeAttribute(
            APPWRITE_DATABASE_ID,
            APPWRITE_COLLECTION_ID,
            name,
            definition.required
          );
        }
        console.log(`Created attribute: ${name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`Attribute ${name} already exists`);

          // Ensure existing attribute config matches the expected schema (esp. string sizes).
          try {
            const existing = await databases.getAttribute(
              APPWRITE_DATABASE_ID,
              APPWRITE_COLLECTION_ID,
              name
            );

            if (definition.type === "string") {
              const existingSize = toNumberOrNull(existing?.size);
              const expectedSize = toNumberOrNull(definition.size);
              const existingRequired = !!existing?.required;
              const expectedRequired = !!definition.required;

              const needsUpdate =
                (existingSize !== null && expectedSize !== null && existingSize < expectedSize) ||
                existingRequired !== expectedRequired;

              if (needsUpdate) {
                await databases.updateStringAttribute(
                  APPWRITE_DATABASE_ID,
                  APPWRITE_COLLECTION_ID,
                  name,
                  expectedRequired,
                  existing?.default ?? null,
                  expectedSize
                );
                console.log(
                  `Updated string attribute: ${name} (size ${existingSize} -> ${expectedSize}, required ${existingRequired} -> ${expectedRequired})`
                );
              }
            }
          } catch (innerError) {
            console.warn(`Could not verify/update attribute ${name}:`, innerError);
          }
        } else {
          console.error(`Error creating attribute ${name}:`, error);
          throw error;
        }
      }
    }

    console.log("Schema migration completed successfully");
  } catch (error) {
    console.error("Schema migration failed:", error);
    throw error;
  }
};

module.exports = {
  comicsSchema,
  migrateSchema,
};
