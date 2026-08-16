import { API_BASE_URL as apiBaseUrl } from "@/constants/apiBaseUrl";

let echo: any | null = null;

export async function getEcho() {
  if (echo) return echo;

  const Echo = (await import("laravel-echo")).default;
  const Pusher = (await import("pusher-js")).default;

  window.Pusher = Pusher;

  echo = new Echo({
    broadcaster: "reverb",

    key: import.meta.env.VITE_REVERB_APP_KEY,

    wsHost:
      import.meta.env.VITE_REVERB_HOST ||
      window.location.hostname,

    wsPort: Number(
      import.meta.env.VITE_REVERB_PORT || 80
    ),

    wssPort: Number(
      import.meta.env.VITE_REVERB_PORT || 443
    ),

    forceTLS:
      (import.meta.env.VITE_REVERB_SCHEME || "http") ===
      "https",

    enabledTransports: ["ws", "wss"],

    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data: any) => void) => {
        const token = localStorage.getItem("token");
        fetch(`${apiBaseUrl}/broadcasting/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
          }),
        })
          .then((res) => res.json())
          .then((data) => callback(null, data))
          .catch(() => callback(new Error("Channel authorization failed"), null));
      },
    }),
  });

  window.Echo = echo;

  return echo;
}

export function disconnectEcho() {
  if (!echo) return;

  echo.disconnect();
  echo = null;

  delete window.Echo;
}