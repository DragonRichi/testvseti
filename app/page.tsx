import MainPage from "@/components/MainPage/MainPage";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function Home() {
  const user = await getCurrentUser()
  return (
    <MainPage isAuthenticated={Boolean(user)} />
  );
}
