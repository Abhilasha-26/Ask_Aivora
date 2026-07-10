import axios from "axios";

// All backend calls go through here. Change baseURL if you deploy the
// Node backend somewhere other than localhost.
//
// Auth: the JWT lives in an httpOnly cookie set by the backend on
// login/register, so it's never touched by JS and can't be read by an
// injected script. `withCredentials` is what makes the browser attach that
// cookie to every request (and store it from every response).
const api = axios.create({
  baseURL: "http://localhost:5005/api",
  withCredentials: true,
});

export default api;
