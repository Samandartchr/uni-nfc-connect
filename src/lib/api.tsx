import { auth } from "./firebase";

export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user signed in");
    return null;
  }
  return user.getIdToken();
}
const apiUrl = "http://localhost:5165/api";

export async function apiRequest(first: string, second: string, method: string, body?: unknown) {
  const token = await getToken();

  return fetch(`${apiUrl}/${first}/${second}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export interface RegisterUserPayload {
  Email: string;
  Name: string;
}

export async function callApiRequest(payload: RegisterUserPayload) {
  return apiRequest("auth", "register", "POST", payload);
}
