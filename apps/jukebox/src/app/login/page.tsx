import { Metadata } from "next";

import LoginClient from "./login-client";

export const metadata: Metadata = {
  title: "Login | YMQ Jukebox",
  description: "Login to YMQ Jukebox",
};

export default function LoginPage() {
  return <LoginClient />;
}
