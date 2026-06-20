import { NextResponse } from "next/server";
import { getAirtimeNetworks, getDataNetworks, PeyflexError } from "@/lib/peyflex";

export async function GET() {
  try {
    const [airtimeNetworks, dataNetworks] = await Promise.all([
      getAirtimeNetworks(),
      getDataNetworks(),
    ]);

    return NextResponse.json({ airtimeNetworks, dataNetworks });
  } catch (err) {
    console.error("[/api/vtu/networks] failed:", err);
    if (err instanceof PeyflexError) {
      return NextResponse.json({ error: "Failed to fetch networks" }, { status: 502 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
