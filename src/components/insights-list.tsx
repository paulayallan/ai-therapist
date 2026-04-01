"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";
import type { Insight } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const insightsCacheKey = "mentara:insights:recent:v1";

export function InsightsList({ insights }: { insights: Insight[] }) {
  const [displayInsights, setDisplayInsights] = useState<Insight[]>(insights);

  useEffect(() => {
    if (insights.length) {
      setDisplayInsights(insights);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(insightsCacheKey, JSON.stringify(insights.slice(0, 20)));
      }
      return;
    }

    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem(insightsCacheKey);
      if (!cached) return;
      try {
        const parsed = JSON.parse(cached) as Insight[];
        if (Array.isArray(parsed) && parsed.length) {
          setDisplayInsights(parsed);
        }
      } catch {
        // Ignore invalid cache data.
      }
    }
  }, [insights]);

  if (!displayInsights.length) {
    return (
      <Card>
        <p className="text-sm text-pine/70">
          Your system is still gathering enough signal for a stronger read. A few more mood logs, journal entries, or support sessions will make the next reflection noticeably sharper.
        </p>
        <div className="mt-4">
          <Link href="/journal">
            <Button variant="secondary">Go to Journal</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {displayInsights.map((insight) => (
        <Card key={insight.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{insight.category ?? insight.insightType}</p>
                {insight.confidence ? (
                  <span className="rounded-full bg-mist px-2 py-1 text-[11px] text-pine/75">{insight.confidence}</span>
                ) : null}
              </div>
              <p className="mt-2 text-base text-ink">{insight.description}</p>
              {insight.basis ? <p className="mt-3 text-sm text-pine/65">{insight.basis}</p> : null}
            </div>
            <div className="flex flex-col items-end gap-3">
              <p className="text-sm text-pine/60">{formatDate(insight.generatedAt)}</p>
              <InsightShareButton insight={insight} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InsightShareButton({ insight }: { insight: Insight }) {
  const [sharing, setSharing] = useState(false);

  async function handleShare(mode: "private" | "full") {
    if (sharing || typeof window === "undefined") return;
    setSharing(true);
    try {
      const file = await renderStoryCard(insight, mode);
      const shortCaption =
        mode === "private"
          ? "A reflection from my Mentara check-in today."
          : `Mentara insight: ${insight.description}`;

      if (navigator.share && "canShare" in navigator) {
        const canShareFiles = navigator.canShare?.({ files: [file] });
        if (canShareFiles) {
          await navigator.share({
            title: "Mentara Insight",
            text: shortCaption,
            files: [file]
          });
          return;
        }
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mentara-insight-story.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" className="px-3" disabled={sharing} onClick={() => handleShare("private")}>
        <Share2 className="mr-2 h-4 w-4" />
        {sharing ? "Preparing..." : "Story share"}
      </Button>
      <Button type="button" variant="ghost" className="px-3" disabled={sharing} onClick={() => handleShare("full")}>
        Full
      </Button>
    </div>
  );
}

async function renderStoryCard(insight: Insight, mode: "private" | "full") {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable.");
  }

  const gradient = context.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#12352f");
  gradient.addColorStop(0.5, "#1f6b5c");
  gradient.addColorStop(1, "#c89f6b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.12)";
  context.beginPath();
  context.arc(940, 210, 240, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f8f2e8";
  context.font = "700 44px Helvetica Neue";
  context.fillText("Mentara", 84, 140);

  context.fillStyle = "#f8f2e8";
  context.font = "600 32px Helvetica Neue";
  context.fillText(mode === "private" ? "Private reflection" : "Insight of the day", 84, 218);

  const text = mode === "private" ? "I noticed something important in my pattern today." : insight.description;
  context.font = "600 62px Helvetica Neue";
  context.fillStyle = "#ffffff";
  wrapText(context, text, 84, 420, 900, 86, 12);

  context.font = "500 30px Helvetica Neue";
  context.fillStyle = "rgba(255,255,255,0.9)";
  context.fillText(mode === "private" ? "Shared privately from Mentara" : "Generated from my Mentara insights", 84, 1710);

  return await new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create share image."));
        return;
      }
      resolve(new File([blob], "mentara-insight-story.png", { type: "image/png" }));
    }, "image/png");
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (let index = 0; index < words.length; index += 1) {
    const testLine = `${line}${words[index]} `;
    const metrics = context.measureText(testLine);
    if (metrics.width > maxWidth && index > 0) {
      context.fillText(line.trim(), x, y);
      line = `${words[index]} `;
      y += lineHeight;
      lineCount += 1;
      if (lineCount >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }

  const finalLine = line.trim();
  if (finalLine) {
    context.fillText(finalLine, x, y);
  }
}
