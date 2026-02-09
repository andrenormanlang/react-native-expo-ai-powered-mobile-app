import { Client, Databases, ID, Functions } from "react-native-appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_COLLECTION_ID,
  APPWRITE_FUNCTION_ID_GENERATE_DESC,
} from "@env";

const withTimeout = (promise, timeoutMs, label = "operation") => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms (${label})`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
};

// Validate and provide a safe fallback endpoint
const FALLBACK_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const resolvedEndpoint =
  typeof APPWRITE_ENDPOINT === "string" && APPWRITE_ENDPOINT.trim().length > 0
    ? APPWRITE_ENDPOINT.trim()
    : FALLBACK_ENDPOINT;

const client = new Client();
if (typeof resolvedEndpoint === "string" && resolvedEndpoint.length > 0) {
  client.setEndpoint(resolvedEndpoint).setProject(APPWRITE_PROJECT_ID);
} else {
  console.error(
    "Appwrite: invalid endpoint. Provide APPWRITE_ENDPOINT in env or update FALLBACK_ENDPOINT.",
  );
}

const databases = new Databases(client);
const functions = new Functions(client);

const DATABASE_ID = APPWRITE_DATABASE_ID;
const COLLECTION_ID = APPWRITE_COLLECTION_ID;
const FUNCTION_ID =
  APPWRITE_FUNCTION_ID_GENERATE_DESC || "comics_description_ai";

const DEFAULT_TIMEOUT_MS = 15000;
const EXECUTION_TIMEOUT_MS = 45000; // give function more time
const EXECUTION_RETRIES = 2;

export const getComics = async () => {
  try {
    console.log("Starting getComics function with:", {
      endpoint: resolvedEndpoint,
      projectId: APPWRITE_PROJECT_ID,
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
    });

    const response = await withTimeout(
      databases.listDocuments(DATABASE_ID, COLLECTION_ID),
      DEFAULT_TIMEOUT_MS,
      "Appwrite listDocuments",
    );
    console.log("Appwrite listDocuments response:", response);

    if (!response || !response.documents) {
      console.warn("No documents found in response");
      return [];
    }

    console.log(`Found ${response.documents.length} comics`);
    return response.documents;
  } catch (error) {
    console.error("Error fetching comics:", error);
    throw error;
  }
};

export const getComic = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    return await withTimeout(
      databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId),
      DEFAULT_TIMEOUT_MS,
      "Appwrite getDocument",
    );
  } catch (error) {
    console.error("Error fetching comic:", error);
    throw error;
  }
};

export const createComic = async (data) => {
  try {
    return await withTimeout(
      databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data),
      DEFAULT_TIMEOUT_MS,
      "Appwrite createDocument",
    );
  } catch (error) {
    console.error("Error creating comic:", error);
    throw error;
  }
};

export const updateComic = async (documentId, data) => {
  try {
    return await withTimeout(
      databases.updateDocument(DATABASE_ID, COLLECTION_ID, documentId, data),
      DEFAULT_TIMEOUT_MS,
      "Appwrite updateDocument",
    );
  } catch (error) {
    console.error("Error updating comic:", error);
    throw error;
  }
};

export const deleteComic = async (documentId) => {
  try {
    return await withTimeout(
      databases.deleteDocument(DATABASE_ID, COLLECTION_ID, documentId),
      DEFAULT_TIMEOUT_MS,
      "Appwrite deleteDocument",
    );
  } catch (error) {
    console.error("Error deleting comic:", error);
    throw error;
  }
};

// --- New function to call the backend function ---
export const fetchGeneratedComicDescription = async (
  title,
  status,
  rating = 0,
) => {
  try {
    if (!title || !status) {
      throw new Error("Title and status are required fields");
    }

    const data = JSON.stringify({
      title: title.trim(),
      status: status.trim(),
      rating: parseInt(rating) || 0,
    });

    console.log("Calling AI function with data:", data);

    // Quick endpoint ping to fail fast when offline / endpoint unreachable
    const pingUrl = `${resolvedEndpoint.replace(/\/$/, "")}/v1/health`;
    try {
      const ping = await withTimeout(
        fetch(pingUrl, { method: "GET" }),
        5000,
        "Appwrite endpoint ping",
      );
      if (!ping || !ping.ok) {
        console.warn("Appwrite ping returned non-OK", ping && ping.status);
      }
    } catch (pingErr) {
      console.error("Appwrite endpoint unreachable:", pingErr);
      throw new Error(
        `Network error or endpoint unreachable: ${pingErr.message}`,
      );
    }

    // Try createExecution with retries and larger timeout
    let lastErr = null;
    let execution = null;
    for (let attempt = 0; attempt < EXECUTION_RETRIES; attempt++) {
      try {
        execution = await withTimeout(
          functions.createExecution(FUNCTION_ID, data),
          EXECUTION_TIMEOUT_MS,
          "Appwrite createExecution",
        );
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.warn(`createExecution attempt ${attempt + 1} failed:`, e);
        // exponential backoff before retry
        const backoff = 700 * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, backoff));
      }
    }

    if (lastErr && !execution) {
      throw lastErr;
    }

    console.log("Function execution response:", execution);

    if (!execution) {
      throw new Error("No execution response received");
    }

    // Parse the response - try both response and responseBody properties
    let responseData;
    if (execution.response) {
      try {
        responseData =
          typeof execution.response === "string"
            ? JSON.parse(execution.response)
            : execution.response;
        console.log("Parsed response:", responseData);
      } catch (parseError) {
        console.error("Failed to parse response:", execution.response);
        throw new Error("Invalid response format from AI function");
      }
    } else if (execution.responseBody) {
      try {
        responseData =
          typeof execution.responseBody === "string"
            ? JSON.parse(execution.responseBody)
            : execution.responseBody;
        console.log("Parsed response from responseBody:", responseData);
      } catch (parseError) {
        console.error("Failed to parse responseBody:", execution.responseBody);
        throw new Error("Invalid response format from AI function");
      }
    }

    // Check if we got any response data
    if (!responseData) {
      console.error("No response data received from function");
      throw new Error("No response received from AI function");
    }

    // Check for errors in the response
    if (responseData.error) {
      throw new Error(responseData.error);
    }

    // Validate response data
    if (!responseData.success || !responseData.description) {
      console.error("Invalid response format:", responseData);
      throw new Error("Invalid response from AI function");
    }

    return responseData.description;
  } catch (error) {
    console.error("Error executing AI function:", error);
    throw error;
  }
};

export default {
  getComics,
  getComic,
  createComic,
  updateComic,
  deleteComic,
  fetchGeneratedComicDescription,
};
