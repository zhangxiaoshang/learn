This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

# 如何使用 NextAuth.js

- [x] 使用 next-auth.js
- [x] 配置 provider
- [x] api 访问 session
- [x] client 访问 session
- [x] 自定义登陆页
- [x] 使用 middleware 保护路由

## 1. 创建一个 Next.js 项目

```bash
# 创建 nextjs 应用
pnpm create next-app

# 进入目录
cd [project]

```

## 2. 安装&配置 NextAuth.js

### 安装 next-auth

```bash
pnpm add next-auth
```

### 配置环境变量

`.env.local`

```env
DISCORD_CLIENT_ID = ...
DISCORD_CLIENT_SECRET = ...
NEXTAUTH_SECRET = ...
```

> NEXTAUTH_SECRET 如果不设置，callbacks#jwt 会异常

### 创建路由文件

`pages/api/auth/[...nextauth].ts`

```ts
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ],
};

export default NextAuth(authOptions);
```

### 配置共享 session state

[参考文档](https://next-auth.js.org/getting-started/example#configure-shared-session-state)

### 创建一个登陆组件

`src/components/login-btn.tsx`

```ts
import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginBtn() {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}
```

### 创建一个受保护的路由（演示如何在 api 中访问验证状态）

`src/pages/api/restricted.ts`

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function restricted(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (session) {
    res.send({
      content:
        "This is protected content. You can access this content because you are signed in.",
    });
  } else {
    res.send({
      error:
        "You must be signed in to view the protected content on this page.",
    });
  }
}
```

### 配置 Callbacks

`src/pages/api/auth/[...nextauth].ts`

```ts
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
  // ...

  callbacks: {
    async jwt({ token, account }: { token: any; account: any }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      return session;
    },
  },

  // ...
};

export default NextAuth(authOptions);
```

现在，可以通过 [`getSession`](https://next-auth.js.org/getting-started/client#getsession) 或者 [`useSession`](https://next-auth.js.org/getting-started/client#usesession) 访问 session 以获取`accessToken`值。

如果是 OAuth(如本案例中使用的 Discord), 还需要配置 callback URL.
本案例 discord 配置的 callback URL 是：
![[Pasted image 20230410150037.png]]
参考：[these steps](https://next-auth.js.org/configuration/providers/oauth#how-to)

### 测试&验证

更新首页文件，添加前面定义的`LoginBtn`组件

```tsx
import LoginBtn from "../components/login-btn";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <LoginBtn></LoginBtn>
    </main>
  );
}
```

启动服务，访问`http://localhost:3000/` 点击`Sign in`即可完成 discord 授权登陆。
然后访问`http://localhost:3000/api/restricted` 可以看到内容是被保护的了！

## 3. 自定义登陆页

上面的登陆流程中，当点击`sign in`时会跳转到 `http://localhost:3000/api/auth/signin?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F`，这是`NextAuth.js`根据`provider`自动生成的登陆页面。

现在看一下如何实现自定义登陆页。

### 创建登陆页

`src/pages/auth/signin.tsx`

```tsx
import { signIn } from "next-auth/react";

export default function SigninPage() {
  return (
    <div>
      <h1>这是自定义的登陆页</h1>

      <button onClick={() => signIn("discord")}>sign in</button>
    </div>
  );
}
```

### 配置 Pages

需要在`src/pages/api/auth/[...nextauth].ts` 文件中进行配置，告诉 next-auth 使用哪个页面作为登陆页

```ts
// ...
  pages: {
    signIn: "/auth/signin",
  }
// ...
```

这时候再访问`http://localhost:3000/`点击`Sign in` 就会跳转至我们自定义的登陆页。
然后点击`sign in with discord`完成登陆。

参考：[configuration/pages](https://next-auth.js.org/configuration/pages)

## 4. 使用 Middleware 保护路由

在`src`目录下创建`middleware.ts`文件(和 pages 文件夹同一等级)
参考：[Using Middleware](https://nextjs.org/docs/advanced-features/middleware#using-middleware)

`src/middleware.ts`

```ts
export { default } from "next-auth/middleware";

export const config = { matcher: ["/profile"] };
```

这个文件声明`/profile`路由是受保护的，必须完成登陆验证才能够访问。

创建`profle`页面，以进行测试
`src/pages/profile/index.tsx`

```tsx
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
```

现在，未登陆情况下访问`/profile` 会自动跳转至登陆页(默认行为)
点击`signin with discord`可以完成登陆，但是登陆完成后依旧停留在登陆页。

如何在完成登陆后跳转至 profile 页面呢？

### 设置 callbackUrl

更新登陆页

```ts
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
```

signin 传入第二个参数，告诉 nextAuth.js 登陆成功后应该跳转到哪个页面
