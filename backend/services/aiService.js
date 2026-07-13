import axios from "axios";

// This is the ONLY place the Node backend talks to the AI microservice.
// All actual AI/agent reasoning happens on the Flask side - this backend
// just forwards the message + recent history and persists the result.
export async function askAgent({ userId, message, history }) {
  const url = `${process.env.AI_SERVICE_URL}/agent/chat`;
  const response = await axios.post(
    url,
    { userId: String(userId), message, history },
    {
      headers: { "X-Internal-Secret": process.env.INTERNAL_SERVICE_SECRET },
      timeout: 60_000,
    }
  );
  return response.data; // { reply, trace, blocked }
}
