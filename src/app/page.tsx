import { redirect } from "next/navigation";

/** Root route — redirect to the login page */
export default function RootPage() {
  redirect("/login");
}
