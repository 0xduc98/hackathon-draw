export const BASE_URL = "http://localhost:3000/api";

export async function postDrawing({ slideId, audienceId, audienceName, imageData }: {
  slideId: string;
  audienceId: string;
  audienceName: string;
  imageData: string;
}) {
  const res = await fetch(`${BASE_URL}/drawings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slideId, audienceId, audienceName, imageData }),
  });
  if (!res.ok) throw new Error("Failed to save drawing");
  return res.json();
} 