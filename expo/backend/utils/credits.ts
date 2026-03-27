/**
 * Credits: Supabase when configured, else in-memory.
 * Starting balance, daily refill, use, grant.
 */
import { supabase } from "../lib/supabase";

const STARTING_CREDITS = 25;
const DAILY_FREE_CREDITS = 5;
const FREE_TIER_DAILY_CAP = 20;

interface CreditRecord {
  credits: number;
  lastDailyRefillAt: number;
}

const records = new Map<string, CreditRecord>();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function ensureRecordDb(userId: string): Promise<{ credits: number; last_daily_refill_at: number }> {
  const { data: existing } = await supabase!.from("credits").select("credits, last_daily_refill_at").eq("user_id", userId).single();
  if (existing) return { credits: existing.credits, last_daily_refill_at: Number(existing.last_daily_refill_at) };
  const now = Date.now();
  await supabase!.from("credits").insert({
    user_id: userId,
    credits: STARTING_CREDITS,
    last_daily_refill_at: now,
  });
  console.log(`[Credits] Initialized (Supabase) for user ${userId}: ${STARTING_CREDITS} credits`);
  return { credits: STARTING_CREDITS, last_daily_refill_at: now };
}

function ensureRecordMemory(userId: string): CreditRecord {
  let r = records.get(userId);
  if (!r) {
    r = { credits: STARTING_CREDITS, lastDailyRefillAt: Date.now() };
    records.set(userId, r);
    console.log(`[Credits] Initialized (memory) for user ${userId}: ${STARTING_CREDITS} credits`);
  }
  return r;
}

function applyDailyRefillMemory(userId: string): CreditRecord {
  const r = ensureRecordMemory(userId);
  const now = Date.now();
  const daysSince = (now - r.lastDailyRefillAt) / MS_PER_DAY;
  if (daysSince >= 1) {
    const daysToApply = Math.min(Math.floor(daysSince), 7);
    const add = daysToApply * DAILY_FREE_CREDITS;
    r.credits = Math.min(r.credits + add, FREE_TIER_DAILY_CAP);
    r.lastDailyRefillAt = now;
    console.log(`[Credits] Daily refill (memory) for ${userId}: +${add}, balance=${r.credits}`);
  }
  return r;
}

export async function getBalance(userId: string): Promise<{ credits: number; nextDailyRefillAt: number }> {
  if (supabase) {
    let row = await ensureRecordDb(userId);
    const now = Date.now();
    const daysSince = (now - row.last_daily_refill_at) / MS_PER_DAY;
    if (daysSince >= 1) {
      const daysToApply = Math.min(Math.floor(daysSince), 7);
      const add = daysToApply * DAILY_FREE_CREDITS;
      const newCredits = Math.min(row.credits + add, FREE_TIER_DAILY_CAP);
      const newRefillAt = now;
      await supabase
        .from("credits")
        .update({ credits: newCredits, last_daily_refill_at: newRefillAt, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      row = { credits: newCredits, last_daily_refill_at: newRefillAt };
      console.log(`[Credits] Daily refill (Supabase) for ${userId}: +${add}, balance=${row.credits}`);
    }
    const nextRefill = row.last_daily_refill_at + MS_PER_DAY;
    return { credits: row.credits, nextDailyRefillAt: nextRefill };
  }
  const r = applyDailyRefillMemory(userId);
  return { credits: r.credits, nextDailyRefillAt: r.lastDailyRefillAt + MS_PER_DAY };
}

export async function useCredits(userId: string, amount: number): Promise<{ credits: number }> {
  if (supabase) {
    const { credits, nextDailyRefillAt } = await getBalance(userId);
    if (credits < amount) throw new Error("Insufficient credits");
    const newCredits = credits - amount;
    await supabase.from("credits").update({ credits: newCredits, updated_at: new Date().toISOString() }).eq("user_id", userId);
    console.log(`[Credits] ${userId} used ${amount} (Supabase), balance=${newCredits}`);
    return { credits: newCredits };
  }
  const r = applyDailyRefillMemory(userId);
  if (r.credits < amount) throw new Error("Insufficient credits");
  r.credits -= amount;
  console.log(`[Credits] ${userId} used ${amount} (memory), balance=${r.credits}`);
  return { credits: r.credits };
}

export async function grantCredits(userId: string, amount: number): Promise<{ credits: number }> {
  if (supabase) {
    await ensureRecordDb(userId);
    const { data: row } = await supabase.from("credits").select("credits").eq("user_id", userId).single();
    const current = row?.credits ?? STARTING_CREDITS;
    const newCredits = current + amount;
    await supabase.from("credits").update({ credits: newCredits, updated_at: new Date().toISOString() }).eq("user_id", userId);
    console.log(`[Credits] ${userId} granted ${amount} (Supabase), balance=${newCredits}`);
    return { credits: newCredits };
  }
  const r = ensureRecordMemory(userId);
  r.credits += amount;
  console.log(`[Credits] ${userId} granted ${amount} (memory), balance=${r.credits}`);
  return { credits: r.credits };
}
