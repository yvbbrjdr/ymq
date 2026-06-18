"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";

export default function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem("username", username);
    router.push("/");
  };

  return (
    <div className="h-screen flex">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm mx-auto my-auto px-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Login to YMQ Jukebox</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Your Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
