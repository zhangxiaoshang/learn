import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Profile page</h1>

      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
