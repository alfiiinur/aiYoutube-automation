import { Prisma, PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

const msToDate = (value) => (value == null ? null : new Date(Number(value)));
const isoToDate = (value) => (value == null ? null : new Date(String(value)));
const json = (value, fallback) => value ?? fallback;

async function main() {
  const dbPath = path.join(process.cwd(), "data", "db.json");
  const snapshot = JSON.parse(await readFile(dbPath, "utf8"));

  const counts = await Promise.all([
    prisma.videoJob.count(),
    prisma.referenceSource.count(),
    prisma.automation.count(),
    prisma.socialAccount.count(),
    prisma.socialPost.count(),
  ]);
  const existing = counts.reduce((sum, n) => sum + n, 0);

  if (existing > 0 && !force) {
    console.log(
      `[seed] Database sudah berisi ${existing} baris. Jalankan "npm run db:seed -- --force" untuk menimpa.`,
    );
    return;
  }

  if (force && existing > 0) {
    console.log("[seed] Menghapus data lama (--force)…");
    await prisma.socialPost.deleteMany();
    await prisma.videoJob.deleteMany();
    await prisma.referenceSource.deleteMany();
    await prisma.automation.deleteMany();
    await prisma.socialAccount.deleteMany();
  }

  const references = snapshot.references ?? [];
  const jobs = snapshot.jobs ?? [];
  const automations = snapshot.automations ?? [];
  const accounts = snapshot.socialAccounts ?? [];
  const posts = snapshot.posts ?? [];

  if (references.length) {
    await prisma.referenceSource.createMany({
      data: references.map((r) => ({
        id: r.id,
        url: r.url,
        platform: r.platform,
        title: r.title ?? "",
        author: r.author ?? null,
        thumbnail: r.thumbnail ?? null,
        description: r.description ?? null,
        durationHint: r.durationHint ?? null,
        insights: r.insights ?? [],
        tags: r.tags ?? [],
        createdAt: msToDate(r.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    });
  }

  for (const j of jobs) {
    await prisma.videoJob.create({
      data: {
        id: j.id,
        title: j.title ?? "",
        prompt: j.prompt ?? "",
        referenceIds: j.referenceIds ?? [],
        aspectRatio: j.aspectRatio ?? "9:16",
        durationSec: Number(j.durationSec ?? 45),
        style: j.style ?? "cinematic",
        voice: j.voice ?? "female-id",
        model: j.model ?? "studio-v1",
        status: j.status ?? "queued",
        progress: Number(j.progress ?? 0),
        createdAt: msToDate(j.createdAt) ?? new Date(),
        updatedAt: msToDate(j.updatedAt) ?? new Date(),
        hook: j.hook ?? "",
        script: j.script ?? "",
        caption: j.caption ?? "",
        hashtags: j.hashtags ?? [],
        scenes: json(j.scenes, []),
        thumbnailIdea: j.thumbnailIdea ?? "",
        musicMood: j.musicMood ?? "",
        logs: json(j.logs, []),
        error: j.error ?? null,
        editor: j.editor ? j.editor : Prisma.JsonNull,
      },
    });
  }

  if (automations.length) {
    await prisma.automation.createMany({
      data: automations.map((a) => ({
        id: a.id,
        name: a.name,
        enabled: Boolean(a.enabled ?? true),
        cron: a.cron ?? "every:1440",
        humanSchedule: a.humanSchedule ?? "",
        promptTemplate: a.promptTemplate ?? "",
        platform: a.platform ?? "youtube",
        privacy: a.privacy ?? "public",
        lastRunAt: msToDate(a.lastRunAt),
        nextRunAt: msToDate(a.nextRunAt),
        runs: Number(a.runs ?? 0),
        createdAt: msToDate(a.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    });
  }

  if (accounts.length) {
    await prisma.socialAccount.createMany({
      data: accounts.map((a) => ({
        id: a.id,
        platform: a.platform,
        accountName: a.accountName,
        accessToken: a.accessToken ?? null,
        userId: a.userId ?? null,
        enabled: Boolean(a.enabled ?? true),
        createdAt: msToDate(a.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    });
  }

  const jobIds = new Set(jobs.map((j) => j.id));
  const validPosts = posts.filter((p) => jobIds.has(p.jobId));
  const skipped = posts.length - validPosts.length;
  if (validPosts.length) {
    await prisma.socialPost.createMany({
      data: validPosts.map((p) => ({
        id: p.id,
        jobId: p.jobId,
        jobTitle: p.jobTitle ?? "",
        platform: p.platform,
        caption: p.caption ?? "",
        hashtags: p.hashtags ?? [],
        mediaUrl: p.mediaUrl ?? null,
        scheduledAt: isoToDate(p.scheduledAt) ?? new Date(),
        status: p.status ?? "scheduled",
        publishedAt: isoToDate(p.publishedAt),
        postUrl: p.postUrl ?? null,
        simulated: Boolean(p.simulated ?? true),
        error: p.error ?? null,
        createdAt: msToDate(p.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    });
  }

  console.log(
    `[seed] Selesai: ${references.length} referensi, ${jobs.length} job, ${automations.length} automation, ${accounts.length} akun, ${validPosts.length} post.` +
      (skipped ? ` ${skipped} post dilewati (job tidak ada).` : ""),
  );
}

main()
  .catch((error) => {
    console.error("[seed] Gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
