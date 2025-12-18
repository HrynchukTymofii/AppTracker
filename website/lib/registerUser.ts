import axios from "axios"

export async function registerUser({ email, password, name }: { email: string, password: string, name: string }) {
  const res = await axios.post("/api/auth/register", {
    email,
    password,
    name,
  })
  return res.data
}
