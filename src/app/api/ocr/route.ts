import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const PROMPT = `You are an OCR assistant. Extract personal information from this Thai national ID card or international passport image.

Return ONLY a valid JSON object with these fields (set to null if not found or not visible):
{
  "firstName":    "English/romanised first name",
  "lastName":     "English/romanised last name",
  "firstNameTh":  "Thai first name (ชื่อ) — null if not a Thai ID",
  "lastNameTh":   "Thai last name (นามสกุล) — null if not a Thai ID",
  "nationalId":   "13-digit Thai national ID number or passport number",
  "dob":          "YYYY-MM-DD (convert Buddhist calendar if Thai ID)",
  "gender":       "male | female | other",
  "nationality":  "nationality string"
}

Rules:
- For Thai ID cards: dob is shown as DD MMM YYYY in Thai/Buddhist Era — convert to AD and YYYY-MM-DD.
- For passports: use the machine-readable zone (MRZ) at the bottom for precision.
- Return ONLY the JSON — no markdown, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return Response.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return Response.json({ success: false, error: "Unsupported file type. Use JPG, PNG, or WebP." }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const message = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type:   "image",
              source: {
                type:       "base64",
                media_type: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data:       base64,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    const raw = (message.content[0] as { type: "text"; text: string }).text.trim();
    // Strip markdown code fences if model wraps in them
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const data = JSON.parse(json);

    // Filter out null values
    const filtered = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== ""));

    return Response.json({ success: true, data: filtered });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
