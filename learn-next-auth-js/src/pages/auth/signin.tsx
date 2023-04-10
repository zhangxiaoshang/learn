import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function SigninPage() {
  const router = useRouter();
  const callbackUrl = router.query.callbackUrl as string;
  console.log("callbackUrl", callbackUrl);

  return (
    <div>
      <h1>这是自定义的登陆页</h1>

      <button onClick={() => signIn("discord", { callbackUrl })}>
        signin with discord
      </button>
    </div>
  );
}
